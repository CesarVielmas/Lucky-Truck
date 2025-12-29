import { NextRequest, NextResponse } from 'next/server';
import { SecureFetch } from '@/lib/secure_fetch';
import { rateLimit } from '@/lib/rate_limit';

const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const isRateLimited = await limiter.check(identifier, 20);
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones' },
        { status: 429 }
      );
    }
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const enhance_ocr = formData.get('enhance_ocr')?.toString() === 'true' || false;
    const process_in_parallel = formData.get('process_in_parallel')?.toString() === 'true' || false;
    const download_enhanced = formData.get('download_enhanced')?.toString() === 'true' || false;
    const limit_thinking_ai = parseInt(formData.get('limit_thinking_ai')?.toString() || '0');

    if (!images || images.length === 0) {
        return NextResponse.json(
            { error: 'Al menos una imagen es requerida' },
            { status: 400 }
        );
    }

    const MAX_IMAGES = 10;
    if (images.length > MAX_IMAGES) {
        return NextResponse.json(
            { error: `Máximo ${MAX_IMAGES} imágenes permitidas` },
            { status: 400 }
        );
    }

    const imagesData: Array<{
        image: string;
        filename: string;
        mime_type: string;
        size: number;
        original_name: string;
    }> = [];

    for (const [index, image] of images.entries()) {
        try {
            if (!image || typeof image !== 'object' || !(image instanceof File)) {
                return NextResponse.json(
                    { error: `La imagen ${index + 1} no es válida` },
                    { status: 400 }
                );
            }
            if (!image.type.startsWith('image/')) {
                return NextResponse.json(
                    { error: `El archivo "${image.name}" debe ser una imagen válida` },
                    { status: 400 }
                );
            }
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (image.size > maxSize) {
                return NextResponse.json(
                    { error: `La imagen "${image.name}" es demasiado grande (máximo 10MB)` },
                    { status: 400 }
                );
            }
            const ALLOWED_MIME_TYPES = [
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/gif',
                'image/webp',
                'image/bmp',
                'image/tiff'
            ];

            if (!ALLOWED_MIME_TYPES.includes(image.type.toLowerCase())) {
                return NextResponse.json(
                    { 
                        error: `Tipo de archivo no permitido para "${image.name}". Formatos aceptados: JPEG, PNG, GIF, WebP, BMP, TIFF`,
                        allowed_types: ALLOWED_MIME_TYPES
                    },
                    { status: 400 }
                );
            }
            const arrayBuffer = await image.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            imagesData.push({
                image: `data:${image.type};base64,${base64Image}`,
                filename: image.name.replace(/\s+/g, '_'),
                mime_type: image.type,
                size: image.size,
                original_name: image.name
            });

        } catch (error) {
            console.error(`Error procesando imagen ${index + 1}:`, error);
            return NextResponse.json(
                { error: `Error al procesar la imagen "${image.name}"` },
                { status: 500 }
            );
        }
    }
    if (limit_thinking_ai < 0 || limit_thinking_ai > 100) {
        return NextResponse.json(
            { error: 'limit_thinking_ai debe estar entre 0 y 100' },
            { status: 400 }
        );
    }
    const payload = {
        files: imagesData,
        enhance_ocr,
        process_in_parallel,
        download_enhanced,
        limit_thinking_ai,
        metadata: {
            total_images: imagesData.length,
            total_size: imagesData.reduce((sum, img) => sum + img.size, 0),
            timestamp: new Date().toISOString(),
            ...(formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {})
        }
    };
    try {
        const secureFetch = new SecureFetch('facture');
        const formDataForAPI = new FormData();
        imagesData.forEach((imageData, index) => {
            const base64Data = imageData.image.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: imageData.mime_type });
            formDataForAPI.append('files', blob, imageData.filename);
        });
        formDataForAPI.append('enhance_ocr', enhance_ocr.toString());
        formDataForAPI.append('process_in_parallel', process_in_parallel.toString());
        formDataForAPI.append('download_enhanced', download_enhanced.toString());
        formDataForAPI.append('limit_thinking_ai', limit_thinking_ai.toString());
        formDataForAPI.append('metadata', JSON.stringify({
            total_images: imagesData.length,
            total_size: imagesData.reduce((sum, img) => sum + img.size, 0),
            timestamp: new Date().toISOString(),
            ...(formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {})
        }));

        const result = await secureFetch.post('/image', formDataForAPI, 'form-data');
        return NextResponse.json({
            success: true,
            data: result,
            message: `${imagesData.length} imagen(es) procesada(s) exitosamente`
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Error al procesar la factura' },
            { status: error.status || 500 }
        );
    }

  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Timeout en procesamiento de la factura' },
        { status: 408 }
      );
    }
    
    if (error.status === 413) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande' },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno al subir imagen' },
      { status: error.status || 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';
    const isRateLimited = await limiter.check(identifier, 15);
    if (isRateLimited) {
      return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
    }
    const { path_dir, model_type, corrected_data } = await request.json();
    if (!path_dir) {
      return NextResponse.json({ error: 'path_dir es requerido' }, { status: 400 });
    }

    if (!model_type || !corrected_data) {
      return NextResponse.json(
        { error: 'model_type y corrected_data son requeridos' }, 
        { status: 400 }
      );
    }
    const dangerousPatterns = /(\.\.\/|\.\.\\|\/\/|\\\\)/;
    if (dangerousPatterns.test(path_dir)) {
      return NextResponse.json(
        { error: 'path_dir contiene patrones peligrosos' },
        { status: 400 }
      );
    }
    const secureFetch = new SecureFetch('facture');
    const backendUrl = `/correct/?path_dir=${path_dir}`;
    const result = await secureFetch.put(backendUrl, {
      model_type,
      corrected_data
    }, 'json');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Factura corregida exitosamente'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error en PUT /api/factures:', error);
    
    if (error.status) {
      return NextResponse.json(
        { error: error.message || 'Error del servidor' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}