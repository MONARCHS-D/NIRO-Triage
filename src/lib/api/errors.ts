/**
 * Custom Error Class for CareIntel API
 * Represents error responses in standard { error: { code, message, correlation_id } } format
 */

export class ApiError extends Error {
  public readonly code: string;
  public readonly correlationId?: string;
  public readonly status: number;
  public readonly rawError?: any;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, correlationId?: string, rawError?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.correlationId = correlationId;
    this.rawError = rawError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static fromResponse(status: number, data: any, fallbackCorrelationId?: string): ApiError {
    const errorObj = data?.error;
    const code = errorObj?.code || `HTTP_${status}`;
    const message = errorObj?.message || data?.detail || 'An unexpected error occurred with the CareIntel service.';
    const correlationId = errorObj?.correlation_id || fallbackCorrelationId;

    return new ApiError(message, code, status, correlationId, data);
  }
}
