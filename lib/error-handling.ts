/**
 * Error handling utilities for the Hotel Billing Management Admin Portal
 * Provides structured error responses, logging, and user-friendly error messages
 * Requirements: 14.1, 14.3
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  INVALID_OPERATION = 'INVALID_OPERATION',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  S3_UPLOAD_FAILED = 'S3_UPLOAD_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Structured error response format
 */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

/**
 * Internal error structure for logging
 */
export interface LoggedError {
  code: ErrorCode;
  message: string;
  details?: any;
  stack?: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Application error class for structured error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create user-friendly error messages based on error codes
 * Requirements: 14.1, 14.3
 */
export function getUserFriendlyMessage(code: ErrorCode, originalMessage?: string): string {
  const friendlyMessages: Record<ErrorCode, string> = {
    // Authentication & Authorization
    [ErrorCode.UNAUTHORIZED]: 'Please log in to access this feature.',
    [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
    [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    
    // Validation
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_INPUT]: 'The information you entered is not valid. Please correct it and try again.',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
    
    // Resource Management
    [ErrorCode.NOT_FOUND]: 'The requested item could not be found.',
    [ErrorCode.ALREADY_EXISTS]: 'This item already exists. Please use a different name or identifier.',
    [ErrorCode.RESOURCE_CONFLICT]: 'This action conflicts with existing data. Please refresh and try again.',
    
    // Business Logic
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have the necessary permissions for this action.',
    [ErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed at this time.',
    [ErrorCode.INVALID_OPERATION]: 'This operation cannot be completed. Please check your input.',
    
    // External Services
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'A service is temporarily unavailable. Please try again in a few moments.',
    [ErrorCode.AI_SERVICE_UNAVAILABLE]: 'The AI billing service is temporarily unavailable. Your invoice has been generated using our backup system.',
    [ErrorCode.S3_UPLOAD_FAILED]: 'File upload failed. Please check your internet connection and try again.',
    [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again or contact support if the problem persists.',
    
    // System
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again or contact support if the problem persists.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again in a few moments.',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment before trying again.',
  };

  return friendlyMessages[code] || originalMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * Log error with structured format
 * Requirements: 14.3
 */
export function logError(
  error: Error | AppError,
  context?: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    additionalDetails?: any;
  }
): void {
  const timestamp = new Date().toISOString();
  
  const loggedError: LoggedError = {
    code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
    message: error.message,
    details: error instanceof AppError ? error.details : undefined,
    stack: error.stack,
    timestamp,
    requestId: context?.requestId,
    userId: context?.userId,
    endpoint: context?.endpoint,
    method: context?.method,
  };

  // Add any additional context details
  if (context?.additionalDetails) {
    loggedError.details = {
      ...loggedError.details,
      ...context.additionalDetails,
    };
  }

  // Log to console (in production, this would go to a proper logging service)
  if (process.env.NODE_ENV === 'production') {
    // In production, log as JSON for structured logging
    console.error(JSON.stringify(loggedError));
  } else {
    // In development, log in a more readable format
    console.error('=== ERROR LOG ===');
    console.error(`Code: ${loggedError.code}`);
    console.error(`Message: ${loggedError.message}`);
    console.error(`Timestamp: ${loggedError.timestamp}`);
    if (loggedError.requestId) console.error(`Request ID: ${loggedError.requestId}`);
    if (loggedError.userId) console.error(`User ID: ${loggedError.userId}`);
    if (loggedError.endpoint) console.error(`Endpoint: ${loggedError.method} ${loggedError.endpoint}`);
    if (loggedError.details) console.error(`Details:`, loggedError.details);
    if (loggedError.stack) console.error(`Stack:`, loggedError.stack);
    console.error('================');
  }
}

/**
 * Create structured error response
 * Requirements: 14.1
 */
export function createErrorResponse(
  error: Error | AppError,
  requestId?: string
): ErrorResponse {
  const timestamp = new Date().toISOString();
  
  if (error instanceof AppError) {
    return {
      error: 'Application Error',
      code: error.code,
      message: getUserFriendlyMessage(error.code, error.message),
      details: error.details,
      timestamp,
      requestId,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: 'Validation Error',
      code: ErrorCode.VALIDATION_ERROR,
      message: getUserFriendlyMessage(ErrorCode.VALIDATION_ERROR),
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
      timestamp,
      requestId,
    };
  }

  // Handle generic errors
  return {
    error: 'Internal Server Error',
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: getUserFriendlyMessage(ErrorCode.INTERNAL_SERVER_ERROR),
    timestamp,
    requestId,
  };
}

/**
 * Create Next.js response with structured error
 * Requirements: 14.1
 */
export function createErrorNextResponse(
  error: Error | AppError,
  requestId?: string
): NextResponse {
  const errorResponse = createErrorResponse(error, requestId);
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handle and log error, then return structured response
 * Requirements: 14.1, 14.3
 */
export function handleError(
  error: Error | AppError,
  context?: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    additionalDetails?: any;
  }
): NextResponse {
  // Log the error
  logError(error, context);
  
  // Return structured response
  return createErrorNextResponse(error, context?.requestId);
}

/**
 * Predefined error creators for common scenarios
 */
export const ErrorCreators = {
  unauthorized: (message?: string) => 
    new AppError(ErrorCode.UNAUTHORIZED, message || 'Unauthorized access', 401),
  
  forbidden: (message?: string) => 
    new AppError(ErrorCode.FORBIDDEN, message || 'Forbidden access', 403),
  
  notFound: (resource?: string) => 
    new AppError(ErrorCode.NOT_FOUND, `${resource || 'Resource'} not found`, 404),
  
  validationError: (details?: any) => 
    new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, details),
  
  alreadyExists: (resource?: string) => 
    new AppError(ErrorCode.ALREADY_EXISTS, `${resource || 'Resource'} already exists`, 409),
  
  internalError: (message?: string, details?: any) => 
    new AppError(ErrorCode.INTERNAL_SERVER_ERROR, message || 'Internal server error', 500, details),
  
  externalServiceError: (service?: string) => 
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `${service || 'External service'} is unavailable`, 502),
  
  aiServiceUnavailable: () => 
    new AppError(ErrorCode.AI_SERVICE_UNAVAILABLE, 'AI service is unavailable, using fallback', 200), // 200 because fallback works
  
  s3UploadFailed: (details?: any) => 
    new AppError(ErrorCode.S3_UPLOAD_FAILED, 'File upload failed', 500, details),
  
  databaseError: (details?: any) => 
    new AppError(ErrorCode.DATABASE_ERROR, 'Database operation failed', 500, details),
  
  rateLimitExceeded: () => 
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', 429),
};

/**
 * Middleware helper to wrap API handlers with error handling
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const requestId = crypto.randomUUID();
      const url = new URL(request.url);
      
      return handleError(
        error instanceof Error ? error : new Error('Unknown error'),
        {
          requestId,
          endpoint: url.pathname,
          method: request.method,
        }
      );
    }
  };
}

/**
 * Retry wrapper for operations that might fail transiently
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName?: string
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        // Log the final failure
        logError(lastError, {
          additionalDetails: {
            operationName,
            attempt,
            maxRetries,
          },
        });
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
}