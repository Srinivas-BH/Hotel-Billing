/**
 * Unit tests for error handling utilities
 * Tests structured error responses, logging, and user-friendly messages
 */

import { 
  AppError, 
  ErrorCode, 
  getUserFriendlyMessage, 
  createErrorResponse, 
  createErrorNextResponse,
  ErrorCreators,
  logError,
  withRetry
} from '@/lib/error-handling';
import { ZodError } from 'zod';

// Mock console methods for testing
const originalConsoleError = console.error;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Error Handling Utilities', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test validation error',
        400,
        { field: 'email' }
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test validation error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should have default values for optional parameters', () => {
      const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Test error');

      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for known error codes', () => {
      const message = getUserFriendlyMessage(ErrorCode.UNAUTHORIZED);
      expect(message).toBe('Please log in to access this feature.');
    });

    it('should return original message for unknown error codes', () => {
      const originalMessage = 'Custom error message';
      const message = getUserFriendlyMessage('UNKNOWN_CODE' as ErrorCode, originalMessage);
      expect(message).toBe(originalMessage);
    });

    it('should return default message when no original message provided', () => {
      const message = getUserFriendlyMessage('UNKNOWN_CODE' as ErrorCode);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should provide appropriate messages for all error types', () => {
      // Test a few key error codes
      expect(getUserFriendlyMessage(ErrorCode.INVALID_CREDENTIALS))
        .toBe('Invalid email or password. Please try again.');
      
      expect(getUserFriendlyMessage(ErrorCode.AI_SERVICE_UNAVAILABLE))
        .toBe('The AI billing service is temporarily unavailable. Your invoice has been generated using our backup system.');
      
      expect(getUserFriendlyMessage(ErrorCode.RATE_LIMIT_EXCEEDED))
        .toBe('Too many requests. Please wait a moment before trying again.');
    });
  });

  describe('createErrorResponse', () => {
    it('should create structured response for AppError', () => {
      const error = new AppError(
        ErrorCode.NOT_FOUND,
        'Menu item not found',
        404,
        { itemId: '123' }
      );

      const response = createErrorResponse(error, 'req-123');

      expect(response.error).toBe('Application Error');
      expect(response.code).toBe(ErrorCode.NOT_FOUND);
      expect(response.message).toBe('The requested item could not be found.');
      expect(response.details).toEqual({ itemId: '123' });
      expect(response.requestId).toBe('req-123');
      expect(response.timestamp).toBeDefined();
    });

    it('should handle ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      const response = createErrorResponse(zodError);

      expect(response.error).toBe('Validation Error');
      expect(response.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.message).toBe('Please check your input and try again.');
      expect(response.details).toEqual([
        {
          field: 'email',
          message: 'Expected string, received number',
        },
      ]);
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const response = createErrorResponse(error);

      expect(response.error).toBe('Internal Server Error');
      expect(response.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe('Something went wrong on our end. Please try again or contact support if the problem persists.');
    });
  });

  describe('createErrorNextResponse', () => {
    it('should create NextResponse with correct status code for AppError', () => {
      const error = new AppError(ErrorCode.UNAUTHORIZED, 'Unauthorized', 401);
      const response = createErrorNextResponse(error);

      expect(response.status).toBe(401);
    });

    it('should default to 500 status for generic errors', () => {
      const error = new Error('Generic error');
      const response = createErrorNextResponse(error);

      expect(response.status).toBe(500);
    });
  });

  describe('logError', () => {
    it('should log AppError with structured format', () => {
      const error = new AppError(
        ErrorCode.DATABASE_ERROR,
        'Connection failed',
        500,
        { connectionString: 'hidden' }
      );

      logError(error, {
        requestId: 'req-123',
        userId: 'user-456',
        endpoint: '/api/test',
        method: 'POST',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log generic error with fallback code', () => {
      const error = new Error('Generic error');

      logError(error, {
        requestId: 'req-123',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include additional details in log', () => {
      const error = new Error('Test error');

      logError(error, {
        additionalDetails: {
          customField: 'customValue',
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('ErrorCreators', () => {
    it('should create unauthorized error', () => {
      const error = ErrorCreators.unauthorized();
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it('should create not found error with custom resource', () => {
      const error = ErrorCreators.notFound('Menu item');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Menu item not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create validation error with details', () => {
      const details = { field: 'email', message: 'Invalid format' };
      const error = ErrorCreators.validationError(details);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details).toBe(details);
      expect(error.statusCode).toBe(400);
    });

    it('should create AI service unavailable error with 200 status', () => {
      const error = ErrorCreators.aiServiceUnavailable();
      expect(error.code).toBe(ErrorCode.AI_SERVICE_UNAVAILABLE);
      expect(error.statusCode).toBe(200); // 200 because fallback works
    });

    it('should create rate limit exceeded error', () => {
      const error = ErrorCreators.rateLimitExceeded();
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(withRetry(operation, 2, 10)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalled(); // Should log the final failure
    });

    it('should include operation name in error log', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test failure'));
      
      await expect(withRetry(operation, 1, 10, 'test-operation')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Error message coverage', () => {
    it('should have user-friendly messages for all error codes', () => {
      // Test that all error codes have user-friendly messages
      const errorCodes = Object.values(ErrorCode);
      
      errorCodes.forEach(code => {
        const message = getUserFriendlyMessage(code);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toContain('undefined');
        expect(message).not.toContain('null');
      });
    });

    it('should provide contextual messages for different error types', () => {
      // Authentication errors should mention login/permissions
      expect(getUserFriendlyMessage(ErrorCode.UNAUTHORIZED)).toContain('log in');
      expect(getUserFriendlyMessage(ErrorCode.FORBIDDEN)).toContain('permission');
      
      // Validation errors should mention input/correction
      expect(getUserFriendlyMessage(ErrorCode.VALIDATION_ERROR)).toContain('input');
      expect(getUserFriendlyMessage(ErrorCode.INVALID_INPUT)).toContain('correct');
      
      // Service errors should mention temporary nature
      expect(getUserFriendlyMessage(ErrorCode.EXTERNAL_SERVICE_ERROR)).toContain('temporarily');
      expect(getUserFriendlyMessage(ErrorCode.SERVICE_UNAVAILABLE)).toContain('temporarily');
    });
  });
});