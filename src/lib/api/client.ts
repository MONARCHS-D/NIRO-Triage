import { ApiError, ApiResponse } from './types';

const DEFAULT_BASE_URL = 'http://localhost:9090/api/v1/triagemitra';

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || DEFAULT_BASE_URL;

const ACCESS_TOKEN_KEY = 'niro_jwt_access_token';
const REFRESH_TOKEN_KEY = 'niro_jwt_refresh_token';

/**
 * Token Storage Utilities (Safe for SSR & Browser)
 */
export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // ignore storage errors
    }
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
  },
};

export interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
  timeoutMs?: number;
}

/**
 * Core HTTP Request Client for NIRO / TriageMitra Backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, timeoutMs = 12000, headers = {}, ...rest } = options;

  // Clean endpoint path
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON envelope
    let json: ApiResponse<T> | null = null;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      json = (await response.json()) as ApiResponse<T>;
    }

    if (!response.ok) {
      const errorMessage =
        (json && (typeof json.payload === 'string' ? json.payload : (json as unknown as { message?: string }).message)) ||
        `HTTP ${response.status}: ${response.statusText}`;

      const error: ApiError = {
        statusCode: response.status,
        message: errorMessage,
        serviceName: json?.serviceName || 'TriageMitra',
        timestamp: json?.timeStamp || new Date().toISOString(),
        details: json?.payload,
      };
      throw error;
    }

    // In successful ApiResponse<T>, the data resides in .payload
    if (json && typeof json === 'object' && 'payload' in json) {
      return json.payload as T;
    }

    // Fallback for non-enveloped response or raw body
    return (json as unknown as T) || ({} as T);
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // If it's already an ApiError, rethrow
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err as ApiError;
    }

    // Handle abort / timeout
    if (err instanceof Error && err.name === 'AbortError') {
      const timeoutError: ApiError = {
        statusCode: 408,
        message: `Request timed out after ${timeoutMs}ms while contacting backend at ${API_BASE_URL}`,
        serviceName: 'TriageMitra',
        timestamp: new Date().toISOString(),
      };
      throw timeoutError;
    }

    // Handle network / CORS errors
    const networkError: ApiError = {
      statusCode: 0,
      message: `Unable to connect to backend at ${API_BASE_URL}. Ensure the Spring Boot service is running on port 9090.`,
      serviceName: 'TriageMitra',
      timestamp: new Date().toISOString(),
      details: err instanceof Error ? err.message : String(err),
    };
    throw networkError;
  }
}

/**
 * Health probe to check if Spring Boot backend is reachable
 */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    // Attempt lightweight ping or OPTIONS request to base URL
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    // Any response from port 9090 (even 404 or 401) indicates the Spring Boot server is alive
    return {
      isOnline: response.status < 500,
      latencyMs,
      message: `Connected (${latencyMs}ms)`,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      isOnline: false,
      latencyMs: 0,
      message: 'Backend offline (Running in Prototype Demo Mode)',
    };
  }
}
