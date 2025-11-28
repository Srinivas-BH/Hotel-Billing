/**
 * Client-side error handling utilities
 * Requirements: 14.1, 14.2, 14.4
 */

import { ErrorResponse } from './error-handling';

/**
 * Extract user-friendly error message from API response
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data: ErrorResponse = await response.json();
    return data.message || 'An unexpected error occurred. Please try again.';
  } catch {
    // If response is not JSON or parsing fails
    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Retry a failed operation with exponential backoff
 * Requirements: 14.4
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a network error (transient)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // Network errors are typically TypeErrors with specific messages
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch')
    );
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown, statusCode?: number): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) {
    return true;
  }

  // 5xx server errors are retryable
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }

  // 429 rate limit errors are retryable
  if (statusCode === 429) {
    return true;
  }

  return false;
}

/**
 * Fetch with automatic retry for transient failures
 * Requirements: 14.4
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  return retryOperation(async () => {
    const response = await fetch(url, options);

    // Only retry on server errors or rate limits
    if (!response.ok && isRetryableError(null, response.status)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, maxRetries);
}

/**
 * Handle API errors with user-friendly messages
 * Requirements: 14.1, 14.2
 */
export async function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred. Please try again.'
): Promise<string> {
  // If it's a Response object
  if (error instanceof Response) {
    return await extractErrorMessage(error);
  }

  // If it's an Error object
  if (error instanceof Error) {
    // Network errors
    if (isNetworkError(error)) {
      return 'Network error. Please check your internet connection and try again.';
    }

    // Return the error message if it's user-friendly
    return error.message || defaultMessage;
  }

  // Unknown error type
  return defaultMessage;
}

/**
 * Validation error formatter for form fields
 * Requirements: 14.2
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function formatValidationErrors(
  errors: ValidationError[]
): Record<string, string> {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Graceful degradation helper
 * Returns a fallback value if operation fails
 * Requirements: 14.4
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return fallback;
  }
}

/**
 * Debounce function for input handling
 * Helps prevent excessive API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
