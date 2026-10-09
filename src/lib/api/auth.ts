/**
 * CareIntel Auth API Client
 */

import { apiFetch, setAuthToken } from './client';
import { LoginRequest, RolePermissionsItem, TokenResponse, UserProfileResponse } from './types';

export const authApi = {
  /**
   * Log in user with email & password to receive a JWT access token.
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
    });
    if (response?.access_token) {
      setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Revoke current user session and remove stored access token.
   */
  async logout(): Promise<void> {
    try {
      await apiFetch<void>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAuthToken(null);
    }
  },

  /**
   * Fetch profile, roles, and permissions of the currently authenticated user.
   */
  async getMe(): Promise<UserProfileResponse> {
    return apiFetch<UserProfileResponse>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Fetch statutory role permission table from the database registry.
   */
  async getRolePermissions(): Promise<RolePermissionsItem[]> {
    return apiFetch<RolePermissionsItem[]>('/auth/roles/permissions', {
      method: 'GET',
    });
  },
};
