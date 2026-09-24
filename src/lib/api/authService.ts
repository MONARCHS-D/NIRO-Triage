/**
 * Authentication API Service
 * Handles user login (email or phone number), token rotation, and logout
 * Endpoint Prefix: /api/v2/triagemitra/auth
 */

import { apiRequest, tokenStorage } from './client';
import { AuthTokenResponse, LoginRequest, LoginResponse } from './types';

/**
 * Sign in user with Email or Phone Number + Password
 * Endpoint: POST /api/v2/triagemitra/auth/login (Public)
 */
export async function loginWithApi(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
      requiresAuth: false,
      credentials: 'include',
    });

    if (response?.accessToken) {
      tokenStorage.setTokens(response.accessToken, response.refreshToken || '');
    }

    return response;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    // If backend is unreachable, provide a resilient fallback profile for demo testing
    if (err.statusCode === 0) {
      console.warn('[NIRO] Backend offline. Using prototype authentication fallback.');
      const lower = request.identifier.toLowerCase();
      let role: 'DOCTOR' | 'NURSE' | 'HEALTH_WORKER' | 'ADMIN' = 'DOCTOR';
      if (lower.includes('nurse') || lower.includes('sunita')) {
        role = 'NURSE';
      } else if (lower.includes('cho') || lower.includes('ramesh') || lower.includes('health')) {
        role = 'HEALTH_WORKER';
      } else if (lower.includes('admin')) {
        role = 'ADMIN';
      }

      const mockResponse: LoginResponse = {
        accessToken: `mock_jwt_${Math.random().toString(36).substring(2)}`,
        refreshToken: `mock_refresh_${Math.random().toString(36).substring(2)}`,
        userPublicId: 'usr-demo-' + Math.random().toString(36).substring(2, 8),
        facilityPublicId: 'fac-demo-1',
        fullName: request.identifier.includes('@') ? request.identifier.split('@')[0] : 'Demo User',
        role,
      };
      tokenStorage.setTokens(mockResponse.accessToken, mockResponse.refreshToken);
      return mockResponse;
    }
    throw error;
  }
}

/**
 * Refresh active JWT token using HttpOnly cookie or stored refresh token
 * Endpoint: POST /api/v2/triagemitra/auth/refresh
 */
export async function refreshWithApi(): Promise<AuthTokenResponse> {
  const refreshToken = tokenStorage.getRefreshToken() || '';
  const response = await apiRequest<AuthTokenResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    requiresAuth: false,
    credentials: 'include',
  });

  if (response?.accessToken) {
    tokenStorage.setTokens(response.accessToken, response.refreshToken || '');
  }

  return response;
}

/**
 * Log out and revoke active tokens
 * Endpoint: POST /api/v2/triagemitra/auth/logout
 */
export async function logoutWithApi(): Promise<void> {
  try {
    const refreshToken = tokenStorage.getRefreshToken() || '';
    await apiRequest<string>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      requiresAuth: true,
      credentials: 'include',
    });
  } catch (e) {
    console.warn('[NIRO] Logout executed locally.', e);
  } finally {
    tokenStorage.clearTokens();
  }
}
