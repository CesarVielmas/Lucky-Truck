import { useState, useCallback, useRef } from 'react';

interface SecureFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  contentType?: 'json' | 'form-data' | 'text' | 'blob';
  timeout?: number;
  retries?: number;
  onProgress?: (progress: number) => void;
}

export interface SecureFetchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface UseSecureFetchReturn {
  loading: boolean;
  error: string | null;
  progress: number;
  fetchSecure: <T = any>(
    endpoint: string, 
    options?: SecureFetchOptions
  ) => Promise<SecureFetchResponse<T>>;
  clear: () => void;
  cancel: () => void;
}

export function useSecureFetch(): UseSecureFetchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSecure = useCallback(async <T = any>(endpoint: string,options: SecureFetchOptions = {}): Promise<SecureFetchResponse<T>> => {
    const {
      method = 'GET',
      headers = {},
      body = null,
      timeout = 30000,
      retries = 1,
      contentType = 'json',
      onProgress
    } = options;
    setLoading(true);
    setError(null);
    setProgress(0);
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);
    const updateProgress = (value: number) => {
      setProgress(value);
      onProgress?.(value);
    };
    let attempt = 0;
    let lastError: Error | null = null;
    while (attempt <= retries) {
      try {
        attempt++;
        let finalBody: BodyInit | null = null;
        let finalHeaders: Record<string, string> = {
          ...headers,
        };
        switch (contentType) {
          
            case 'form-data':
            finalBody = body as FormData;
            break;
          
          case 'text':
            finalHeaders['Content-Type'] = 'text/plain';
            finalBody = body as string;
            break;
          
          case 'blob':
            finalHeaders['Content-Type'] = 'application/octet-stream';
            finalBody = body as Blob;
            break;
          
          case 'json':
          default:
            if (body) {
              finalHeaders['Content-Type'] = 'application/json';
              finalBody = JSON.stringify(body);
            }
            break;
        }

        if (method !== 'GET') {
          let currentProgress = 0;
          progressIntervalRef.current = setInterval(() => {
            currentProgress = Math.min(currentProgress + 10, 90);
            updateProgress(currentProgress);
          }, 200);
        }

        const response = await fetch(`/api${endpoint}`, {
          method,
          headers: finalHeaders,
          body: finalBody,
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        });

        clearTimeout(timeoutId);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        const responseData: SecureFetchResponse<T> = await response.json();

        updateProgress(100);

        if (!response.ok) {
          throw new Error(responseData.error || `HTTP ${response.status}`);
        }

        setTimeout(() => updateProgress(0), 1000);
        setLoading(false);

        return responseData;

      } catch (err) {
        clearTimeout(timeoutId);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        lastError = err as Error;
        if (attempt > retries || (err as any)?.name !== 'TypeError') {
          break;
        }
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const errorMessage = lastError?.name === 'AbortError' 
      ? 'La petición fue cancelada por timeout'
      : lastError?.message || 'Error desconocido';

    setError(errorMessage);
    setLoading(false);
    
    return {
      success: false,
      error: errorMessage,
      status: lastError?.name === 'AbortError' ? 408 : 500
    };

  }, []);

  const clear = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLoading(false);
    setError('Petición cancelada');
    setProgress(0);
  }, []);

  return {
    loading,
    error,
    progress,
    fetchSecure,
    clear,
    cancel,
  };
}