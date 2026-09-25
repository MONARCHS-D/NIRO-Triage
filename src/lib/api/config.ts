/**
 * CareIntel API Configuration
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const AUTH_TOKEN_STORAGE_KEY = 'careintel_access_token_v1';
export const USER_PROFILE_STORAGE_KEY = 'careintel_user_profile_v1';

export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_POLL_INTERVAL_MS = 2000;
export const MAX_POLL_ATTEMPTS = 30;
