import { NextResponse } from 'next/server';
import { ErrorCode, ApiError, ApiResponse } from '@/lib/types/shelf';

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Authentication required (401)
 */
export function authRequiredError(message = 'Authentication required'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.AUTH_REQUIRED, message, 401);
}

/**
 * Invalid credentials (401)
 */
export function invalidCredentialsError(message = 'Invalid credentials'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.INVALID_CREDENTIALS, message, 401);
}

/**
 * Invalid token (401)
 */
export function invalidTokenError(message = 'Invalid token'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.INVALID_TOKEN, message, 401);
}

/**
 * Forbidden / Unauthorized access (403)
 */
export function forbiddenError(message = 'Access forbidden'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.FORBIDDEN, message, 403);
}

/**
 * Insufficient permissions (403)
 */
export function insufficientPermissionsError(message = 'Insufficient permissions'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403);
}

/**
 * Validation failed (400)
 */
export function validationError(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.VALIDATION_FAILED, message, 400, details);
}

/**
 * Invalid input (400)
 */
export function invalidInputError(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.INVALID_INPUT, message, 400, details);
}

/**
 * Missing required field (400)
 */
export function missingFieldError(
  field: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return createErrorResponse(
    ErrorCode.MISSING_FIELD,
    `Missing required field: ${field}`,
    400,
    details
  );
}

/**
 * Resource not found (404)
 */
export function notFoundError(resource = 'Resource'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
}

/**
 * Resource already exists (409)
 */
export function alreadyExistsError(resource = 'Resource'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409);
}

/**
 * Duplicate entry (409)
 */
export function duplicateEntryError(message: string): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.DUPLICATE_ENTRY, message, 409);
}

/**
 * Rate limit exceeded (429)
 */
export function rateLimitError(
  message = 'Too many requests. Please try again later.',
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details);
}

/**
 * Internal server error (500)
 */
export function internalError(message = 'Internal server error'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.INTERNAL_ERROR, message, 500);
}

/**
 * Database error (500)
 */
export function databaseError(message = 'Database operation failed'): NextResponse<ApiResponse> {
  return createErrorResponse(ErrorCode.DATABASE_ERROR, message, 500);
}

/**
 * External service error (500)
 */
export function externalServiceError(service: string): NextResponse<ApiResponse> {
  return createErrorResponse(
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    `External service error: ${service}`,
    500
  );
}
