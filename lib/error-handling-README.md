# Error Handling Utilities

This module provides structured error handling utilities for the Hotel Billing Management Admin Portal, implementing requirements 14.1 and 14.3.

## Features

- **Structured Error Responses**: Consistent error format across all API endpoints
- **User-Friendly Messages**: Technical errors are converted to user-understandable messages
- **Comprehensive Logging**: Structured error logging with context information
- **Retry Logic**: Built-in retry mechanism for transient failures
- **Type Safety**: Full TypeScript support with predefined error codes

## Quick Start

### Basic Usage in API Routes

```typescript
import { handleError, ErrorCreators } from '@/lib/error-handling';

export async function POST(request: NextRequest) {
  try {
    // Your API logic here
    const result = await someOperation();
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, {
      requestId: crypto.randomUUID(),
      endpoint: '/api/your-endpoint',
      method: 'POST',
    });
  }
}
```

### Using Error Creators

```typescript
// Throw specific errors
throw ErrorCreators.unauthorized();
throw ErrorCreators.notFound('Menu item');
throw ErrorCreators.validationError({ field: 'email', message: 'Invalid format' });
```

### Using Retry Logic

```typescript
import { withRetry } from '@/lib/error-handling';

const result = await withRetry(
  () => databaseOperation(),
  3, // max retries
  1000, // delay in ms
  'database-operation' // operation name for logging
);
```

### Middleware Wrapper

```typescript
import { withErrorHandling } from '@/lib/error-handling';

const handler = async (request: NextRequest) => {
  // Your handler logic - any thrown errors will be automatically handled
  return NextResponse.json({ success: true });
};

export const POST = withErrorHandling(handler);
```

## Error Codes

The system uses predefined error codes for consistency:

- **Authentication**: `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- **Resources**: `NOT_FOUND`, `ALREADY_EXISTS`, `RESOURCE_CONFLICT`
- **External Services**: `AI_SERVICE_UNAVAILABLE`, `S3_UPLOAD_FAILED`, `DATABASE_ERROR`
- **System**: `INTERNAL_SERVER_ERROR`, `RATE_LIMIT_EXCEEDED`

## Error Response Format

All errors return a consistent structure:

```json
{
  "error": "Application Error",
  "code": "VALIDATION_ERROR",
  "message": "Please check your input and try again.",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "req-123"
}
```

## User-Friendly Messages

Technical errors are automatically converted to user-friendly messages:

- `UNAUTHORIZED` → "Please log in to access this feature."
- `AI_SERVICE_UNAVAILABLE` → "The AI billing service is temporarily unavailable. Your invoice has been generated using our backup system."
- `RATE_LIMIT_EXCEEDED` → "Too many requests. Please wait a moment before trying again."

## Logging

Errors are logged with structured information:

```typescript
{
  "code": "DATABASE_ERROR",
  "message": "Connection failed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "req-123",
  "userId": "user-456",
  "endpoint": "POST /api/billing/generate",
  "stack": "Error stack trace...",
  "details": { "additionalContext": "value" }
}
```

## Best Practices

1. **Use Specific Error Codes**: Choose the most appropriate error code for each situation
2. **Include Context**: Always provide request ID and endpoint information
3. **Don't Expose Sensitive Data**: Error details should not contain passwords, tokens, or internal system information
4. **Log for Debugging**: Include enough context in logs to debug issues
5. **Retry Transient Failures**: Use `withRetry` for operations that might fail temporarily

## Integration with Existing Code

The error handling utilities are designed to work with existing patterns:

- **Zod Validation**: Automatically handles `ZodError` and converts to structured format
- **Database Errors**: Provides specific error codes for database operations
- **External Services**: Handles timeouts and service unavailability gracefully
- **Authentication**: Integrates with existing JWT and session management

## Testing

The error handling utilities include comprehensive tests covering:

- Error creation and formatting
- User-friendly message generation
- Logging functionality
- Retry logic
- Integration with common error types (Zod, generic errors)

Run tests with:
```bash
npm test -- __tests__/error-handling-server.test.ts
```