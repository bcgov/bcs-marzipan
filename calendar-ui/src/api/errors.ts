/**
 * API Error Handling
 *
 * Provides typed error classes and utilities for handling Problem Details
 * (RFC 7807) responses from the API.
 */

// ============================================================================
// Type Guard Utilities
// ============================================================================

type AnyRecord = Record<string, unknown>;

/** Check if value is a non-null object */
function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

/** Check if object has all specified keys */
function hasKeys<K extends string>(
  obj: AnyRecord,
  ...keys: K[]
): obj is AnyRecord & Record<K, unknown> {
  return keys.every((key) => key in obj);
}

/** Safely get a string property from an object */
function getString(obj: AnyRecord, key: string, fallback: string): string {
  const value = obj[key];
  return typeof value === 'string' ? value : fallback;
}

/** Safely get a number property from an object */
function getNumber(obj: AnyRecord, key: string, fallback: number): number {
  const value = obj[key];
  return typeof value === 'number' ? value : fallback;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Problem Details response format (RFC 7807)
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string;
  errors?: Array<{ path: string; message: string; code?: string }>;
  timestamp?: string;
  stack?: string; // Only in development
}

/**
 * API Error class for typed error handling
 *
 * Extends Error with Problem Details fields for structured error handling
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly detail: string;
  public readonly correlationId: string;
  public readonly instance: string;
  public readonly errors?: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
  public readonly timestamp?: string;

  constructor(problemDetails: ProblemDetails) {
    super(problemDetails.detail);
    this.name = 'ApiError';
    this.status = problemDetails.status;
    this.type = problemDetails.type;
    this.detail = problemDetails.detail;
    this.correlationId = problemDetails.correlationId;
    this.instance = problemDetails.instance;
    this.errors = problemDetails.errors;
    this.timestamp = problemDetails.timestamp;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if this is a validation error (400/422 with field errors)
   */
  isValidationError(): boolean {
    return (
      (this.status === 400 || this.status === 422) &&
      Array.isArray(this.errors) &&
      this.errors.length > 0
    );
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    // Retry on server errors (5xx) and specific client errors
    return (
      this.status >= 500 || // All server errors
      this.status === 408 || // Request Timeout
      this.status === 429 // Too Many Requests
    );
  }
}

/**
 * Network error (no response from server)
 */
export class NetworkError extends Error {
  public readonly correlationId?: string;

  constructor(message: string, correlationId?: string) {
    super(message);
    this.name = 'NetworkError';
    this.correlationId = correlationId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Parse error response to Problem Details format
 */
export function parseErrorResponse(error: unknown): ProblemDetails | null {
  // Handle axios error response
  if (!isRecord(error) || !hasKeys(error, 'response')) return null;

  const response = error.response;
  if (!isRecord(response) || !hasKeys(response, 'data')) return null;

  const data = response.data;

  // Check if it's already in Problem Details format
  if (
    isRecord(data) &&
    hasKeys(
      data,
      'type',
      'title',
      'status',
      'detail',
      'instance',
      'correlationId'
    )
  ) {
    return data as ProblemDetails;
  }

  // Fallback: construct Problem Details from standard error response
  const statusCode =
    getNumber(response, 'statusCode', 0) || getNumber(response, 'status', 500);
  const headers = isRecord(response.headers) ? response.headers : {};
  const config = isRecord(error.config) ? error.config : {};

  let detail: string;
  if (isRecord(data) && hasKeys(data, 'message')) {
    detail = getString(data, 'message', 'An error occurred');
  } else if (typeof data === 'string' && data.trim() !== '') {
    detail = data.trim();
  } else if (statusCode >= 400) {
    detail = `Request failed with status ${statusCode}`;
  } else {
    return null;
  }

  return {
    type: `https://api.example.com/errors/${statusCode}`,
    title: detail,
    status: statusCode,
    detail,
    instance: getString(config, 'url', ''),
    correlationId: getString(headers, 'x-correlation-id', 'unknown'),
  };
}

/** Helper to create a fallback ApiError */
function createFallbackApiError(detail: string): ApiError {
  return new ApiError({
    type: 'https://api.example.com/errors/unknown',
    title: 'Unknown Error',
    status: 500,
    detail,
    instance: '',
    correlationId: 'unknown',
  });
}

/**
 * Create ApiError from axios error or other error types
 */
export function createApiError(error: unknown): ApiError | NetworkError {
  // Check for network error (no response)
  if (isRecord(error) && hasKeys(error, 'code')) {
    const code = error.code;
    if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') {
      const config = isRecord(error.config) ? error.config : {};
      const headers = isRecord(config.headers) ? config.headers : {};
      const correlationId =
        typeof headers['X-Correlation-ID'] === 'string'
          ? headers['X-Correlation-ID']
          : undefined;

      return new NetworkError(
        'Network error: Unable to connect to server',
        correlationId
      );
    }
  }

  // Parse Problem Details response
  const problemDetails = parseErrorResponse(error);
  if (problemDetails) {
    return new ApiError(problemDetails);
  }

  // Fallback: create generic ApiError
  const detail =
    error instanceof Error
      ? error.message || 'An unexpected error occurred'
      : 'An unexpected error occurred';

  return createFallbackApiError(detail);
}
