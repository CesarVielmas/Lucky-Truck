class SecureFetchError extends Error {
  constructor(message: string,public status?: number,public code?: string) {
    super(message);
    this.name = 'SecureFetchError';
  }
}

export class SecureFetch {
  private baseURL: string;
  private secretKey: string;
  private timeout: number;

  constructor(type_api : string) {
    if(type_api === 'facture'){
        this.baseURL = process.env.BASE_URL_API_FACTURES!;
        this.secretKey = process.env.BASE_URL_API_FACTURES_KEY!;
        this.timeout = parseInt(process.env.BASE_API_FACTURES_TIMEOUT || '60000');
    }
    else 
        throw new Error('Tipo de API no soportado');
    if (!this.baseURL || !this.secretKey) {
      throw new Error('Configuración de API no encontrada');
    }
  }
  async request<T>(endpoint: string,options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const url = `${this.baseURL}${endpoint}`;
      const defaultHeaders: HeadersInit = {
        'Authorization': `Bearer ${this.secretKey}`,
        'X-API-Key': this.secretKey,
      };
      let body = options.body;
      let contentType = 'application/json';
      if (body instanceof FormData) {
        contentType = '';
      } else if (typeof body === 'string') {
        contentType = 'text/plain';
      } else if (body instanceof Blob) {
        contentType = 'application/octet-stream';
      }
      if (contentType && !(body instanceof FormData)) {
        defaultHeaders['Content-Type'] = contentType;
      }
      if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
        body = JSON.stringify(body);
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new SecureFetchError(
          `Error ${response.status}: ${response.statusText}`,
          response.status,
          `HTTP_${response.status}`
        );
      }

      const data = await response.json();
      return data as T;

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof SecureFetchError) {
        throw error;
      }

      if ((error as any)?.name === 'AbortError') {
        throw new SecureFetchError('Timeout de la petición', 408, 'TIMEOUT');
      }

      throw new SecureFetchError(
        error instanceof Error ? error.message : 'Error desconocido',
        500,
        'NETWORK_ERROR'
      );
    }
  }

  async gets<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async get<T>(endpoint: string, id: string): Promise<T> {
    return this.request<T>(endpoint + "/" + id, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, contentType: string = 'json'): Promise<T> {
    let body: any = data;
    let headers: HeadersInit = {};

    switch (contentType) {
      case 'form-data':
        body = data; 
        break;
      case 'text':
        headers['Content-Type'] = 'text/plain';
        body = data;
        break;
      case 'blob':
        headers['Content-Type'] = 'application/octet-stream';
        body = data;
        break;
      case 'json':
      default:
        headers['Content-Type'] = 'application/json';
        body = data;
        break;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body,
    });
  }

  async put<T>(endpoint: string, data?: any, contentType: string = 'json'): Promise<T> {
    let body: any = data;
    let headers: HeadersInit = {};

    switch (contentType) {
      case 'form-data':
        body = data;
        break;
      case 'text':
        headers['Content-Type'] = 'text/plain';
        body = data;
        break;
      case 'blob':
        headers['Content-Type'] = 'application/octet-stream';
        body = data;
        break;
      case 'json':
      default:
        headers['Content-Type'] = 'application/json';
        body = data;
        break;
    }

    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

}