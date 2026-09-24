import { ApiError, ApiResponse } from './types';

// Root host URL for the Spring Boot backend
const DEFAULT_HOST_URL = 'http://localhost:9090';

export const API_HOST_URL =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_API_HOST_URL || process.env.NEXT_PUBLIC_API_BASE_URL)) ||
  DEFAULT_HOST_URL;

// Base path for v1 and v2 services
export const API_V1_BASE = `${API_HOST_URL.replace(/\/api\/(v1|v2)\/triagemitra\/?$/, '')}/api/v1/triagemitra`;
export const API_V2_BASE = `${API_HOST_URL.replace(/\/api\/(v1|v2)\/triagemitra\/?$/, '')}/api/v2/triagemitra`;

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
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
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
  skipAuthRefresh?: boolean;
}

/**
 * Normalize and construct target URL according to backend route versioning
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If already prefixed with /api/v1/ or /api/v2/
  if (cleanEndpoint.startsWith('/api/v1/') || cleanEndpoint.startsWith('/api/v2/')) {
    const root = API_HOST_URL.replace(/\/api\/(v1|v2)\/triagemitra\/?$/, '');
    return `${root}${cleanEndpoint}`;
  }

  // Version 2 Endpoints: Auth and Staff
  if (cleanEndpoint.startsWith('/auth/') || cleanEndpoint.startsWith('/staff/')) {
    return `${API_V2_BASE}${cleanEndpoint}`;
  }

  // Version 1 Endpoints: Onboarding, Facilities, Cases, Sessions
  return `${API_V1_BASE}${cleanEndpoint}`;
}

/**
 * Core HTTP Request Client for NIRO / TriageMitra Backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    requiresAuth = false,
    timeoutMs = 12000,
    skipAuthRefresh = false,
    headers = {},
    credentials = 'include', // Includes HttpOnly refreshToken cookies
    ...rest
  } = options;

  const url = buildApiUrl(endpoint);

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  // If body is FormData, let browser handle Content-Type boundary
  if (options.body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

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
      credentials,
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
      // If 401 Unauthorized and not already refreshing, attempt token refresh
      if (response.status === 401 && !skipAuthRefresh && !endpoint.includes('/auth/')) {
        try {
          const newTokens = await refreshSessionToken();
          if (newTokens?.accessToken) {
            // Retry the original request with the fresh token
            return apiRequest<T>(endpoint, {
              ...options,
              skipAuthRefresh: true,
            });
          }
        } catch {
          // Refresh failed; clear local tokens
          tokenStorage.clearTokens();
        }
      }

      const errorMessage =
        (json &&
          (typeof json.payload === 'string'
            ? json.payload
            : (json as unknown as { message?: string }).message)) ||
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

    // In successful ApiResponse<T>, data resides in .payload
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
        message: `Request timed out after ${timeoutMs}ms while contacting backend at ${url}`,
        serviceName: 'TriageMitra',
        timestamp: new Date().toISOString(),
      };
      throw timeoutError;
    }

    // Handle network / CORS errors
    const networkError: ApiError = {
      statusCode: 0,
      message: `Unable to connect to backend at ${url}. Ensure the Spring Boot service is running on port 9090.`,
      serviceName: 'TriageMitra',
      timestamp: new Date().toISOString(),
      details: err instanceof Error ? err.message : String(err),
    };
    throw networkError;
  }
}

/**
 * Refresh JWT access token using Cookie or Refresh Token
 */
async function refreshSessionToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const refreshToken = tokenStorage.getRefreshToken() || '';
    const res = await apiRequest<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuthRefresh: true,
        credentials: 'include',
      }
    );
    if (res?.accessToken) {
      tokenStorage.setTokens(res.accessToken, res.refreshToken || '');
      return res;
    }
    return null;
  } catch {
    return null;
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
    // Attempt lightweight ping to API v1 or root
    const response = await fetch(`${API_HOST_URL}/api/v1/triagemitra/onboarding/facility-admin`, {
      method: 'OPTIONS',
      signal: controller.signal,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

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

export const API_BASE_URL = API_V1_BASE;
