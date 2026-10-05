/**
 * Core HTTP Client for CareIntel API
 * Handles JWT Auth, X-Correlation-ID headers, standard error parsing, and binary streams
 */

import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY, DEFAULT_TIMEOUT_MS } from './config';
import { ApiError } from './errors';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    params,
    headers: customHeaders = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuth = false,
    ...fetchOptions
  } = options;

  // Build URL with query params
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${cleanEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  const correlationId = generateCorrelationId();
  const headers = new Headers(customHeaders);

  // Correlation ID
  if (!headers.has('X-Correlation-ID')) {
    headers.set('X-Correlation-ID', correlationId);
  }

  // Auth Header
  if (!skipAuth) {
    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Handle Payload
  let requestBody: any = undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob) {
      requestBody = body;
    } else {
      headers.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    }
  }

  // Abort Controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const responseCorrelationId = response.headers.get('X-Correlation-ID') || correlationId;

    // Check for Binary Stream response (e.g. Audio TTS)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
      if (!response.ok) {
        throw new ApiError(`Audio fetch failed with status ${response.status}`, 'AUDIO_ERROR', response.status, responseCorrelationId);
      }
      const blob = await response.blob();
      return blob as unknown as T;
    }

    // JSON response parsing
    let data: any = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    }

    if (!response.ok) {
      // If 401, trigger session expired event
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careintel:session-expired'));
      }
      throw ApiError.fromResponse(response.status, data, responseCorrelationId);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 'TIMEOUT_ERROR', 408, correlationId);
    }
    throw new ApiError(error.message || 'Network error occurred.', 'NETWORK_ERROR', 0, correlationId, error);
  }
}
