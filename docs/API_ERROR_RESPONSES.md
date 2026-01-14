# API Error Response Documentation

## Overview

All API error responses in Virtual Bookshelf follow a standardized format to ensure consistent error handling across the frontend and make debugging easier.

## Error Response Structure

All error responses have the following structure:

```typescript
{
  success: false,
  error: {
    code: ErrorCode,      // Standard error code (enum)
    message: string,      // Human-readable error message
    details?: object      // Optional additional context
  }
}
```

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "reason": "Must be a valid email format"
    }
  }
}
```

## Error Codes

### Authentication Errors (401)

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_REQUIRED` | Authentication required | User must be logged in to access this resource |
| `INVALID_CREDENTIALS` | Invalid credentials | Username/password combination is incorrect |
| `INVALID_TOKEN` | Invalid token | Session token is expired or malformed |

**Example Usage:**
```typescript
// Login with incorrect password
POST /api/auth/login
Response: 401
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

### Authorization Errors (403)

| Code | Message | Description |
|------|---------|-------------|
| `FORBIDDEN` | Access forbidden | User lacks permission to access this resource |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | User authenticated but lacks specific permissions |

**Example Usage:**
```typescript
// Trying to delete another user's shelf
DELETE /api/shelf/shelf-123
Response: 403
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access forbidden"
  }
}
```

### Validation Errors (400)

| Code | Message | Description |
|------|---------|-------------|
| `VALIDATION_FAILED` | Validation failed | Input validation error |
| `INVALID_INPUT` | Invalid input | General input error |
| `MISSING_FIELD` | Missing required field: {field} | Required field not provided |

**Example Usage:**
```typescript
// Creating item without required field
POST /api/items
{
  "shelf_id": "shelf-123",
  "type": "book",
  // Missing required "title" field
}
Response: 400
{
  "success": false,
  "error": {
    "code": "MISSING_FIELD",
    "message": "Missing required field: title"
  }
}

// Invalid item type
POST /api/items
{
  "shelf_id": "shelf-123",
  "type": "movie",  // Invalid type
  "title": "Example"
}
Response: 400
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Type must be one of: book, podcast, music, podcast_episode, video"
  }
}
```

### Not Found Errors (404)

| Code | Message | Description |
|------|---------|-------------|
| `NOT_FOUND` | {Resource} not found | Requested resource does not exist |
| `RESOURCE_NOT_FOUND` | Resource not found | Generic resource not found |

**Example Usage:**
```typescript
// Accessing non-existent shelf
GET /api/shelf/nonexistent-id
Response: 404
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Shelf not found"
  }
}
```

### Conflict Errors (409)

| Code | Message | Description |
|------|---------|-------------|
| `ALREADY_EXISTS` | {Resource} already exists | Resource already exists |
| `DUPLICATE_ENTRY` | {Custom message} | Duplicate entry detected |

**Example Usage:**
```typescript
// Signing up with existing username
POST /api/auth/signup
{
  "username": "existinguser",
  "email": "new@example.com",
  "password": "password123"
}
Response: 409
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "Username already taken"
  }
}
```

### Rate Limit Errors (429)

| Code | Message | Description |
|------|---------|-------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Rate limit exceeded |

**Example Usage:**
```typescript
// Too many login attempts
POST /api/auth/login
Response: 429
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60,
      "limit": 5,
      "remaining": 0
    }
  }
}
```

**Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1736831567000
```

### Server Errors (500)

| Code | Message | Description |
|------|---------|-------------|
| `INTERNAL_ERROR` | Internal server error | Unexpected server error |
| `DATABASE_ERROR` | Database operation failed | Database error occurred |
| `EXTERNAL_SERVICE_ERROR` | External service error: {service} | Third-party service error |

**Example Usage:**
```typescript
// Database connection failure
POST /api/items
Response: 500
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Database operation failed"
  }
}

// Google OAuth failure
GET /api/auth/google/callback
Response: 500
{
  "success": false,
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "External service error: Google OAuth"
  }
}
```

## Frontend Error Handling

### TypeScript Types

The error response types are defined in `lib/types/shelf.ts`:

```typescript
import { ErrorCode, ApiError, ApiResponse } from '@/lib/types/shelf';

// Handle API response
async function callAPI() {
  const response = await fetch('/api/endpoint');
  const data: ApiResponse<MyDataType> = await response.json();
  
  if (!data.success) {
    // data.error is guaranteed to be defined
    const { code, message, details } = data.error;
    
    switch (code) {
      case ErrorCode.AUTH_REQUIRED:
        // Redirect to login
        break;
      case ErrorCode.VALIDATION_FAILED:
        // Show validation errors
        console.error('Validation error:', message, details);
        break;
      // ... handle other error codes
    }
  }
}
```

### Error Handling Example

```typescript
try {
  const response = await fetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
  
  const result: ApiResponse<Item> = await response.json();
  
  if (!result.success) {
    const { code, message, details } = result.error;
    
    // Show user-friendly error message
    switch (code) {
      case 'VALIDATION_FAILED':
        toast.error(`Validation error: ${message}`);
        if (details) {
          // Display field-specific errors
          Object.entries(details).forEach(([field, error]) => {
            console.error(`${field}: ${error}`);
          });
        }
        break;
      
      case 'AUTH_REQUIRED':
        router.push('/login');
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = details?.retryAfter || 60;
        toast.error(`Too many requests. Try again in ${retryAfter} seconds.`);
        break;
      
      default:
        toast.error(message);
    }
  } else {
    // Success - data.data is available
    const item = result.data;
    toast.success('Item created successfully!');
  }
} catch (error) {
  // Network error or JSON parse error
  toast.error('Failed to connect to server');
}
```

## Migration Notes

### Breaking Changes

The error response format has changed from:

```typescript
// OLD FORMAT (deprecated)
{
  success: false,
  error: "Error message string"
}
```

To:

```typescript
// NEW FORMAT
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Error message string",
    details: { /* optional */ }
  }
}
```

### Backward Compatibility

The `message` field is temporarily available at the root level for backward compatibility:

```typescript
{
  success: false,
  error: { ... },
  message: "Still available for now"  // Deprecated
}
```

This field will be removed in a future version. Please update your code to use `error.message` instead.

## Implementation

Error helper functions are available in `lib/utils/errors.ts`:

```typescript
import {
  authRequiredError,
  validationError,
  notFoundError,
  // ... other helpers
} from '@/lib/utils/errors';

// In API route handlers
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return authRequiredError();
  }
  
  const body = await request.json();
  if (!body.title) {
    return missingFieldError('title');
  }
  
  if (titleValidation.invalid) {
    return validationError('Invalid title', {
      field: 'title',
      reason: titleValidation.error
    });
  }
  
  // Success response
  return NextResponse.json({
    success: true,
    data: { /* response data */ }
  });
}
```

## Summary

- **All errors** use standardized `{ success: false, error: { code, message, details? } }` format
- **Error codes** are enum values for type safety and consistency
- **Details object** provides additional context when needed
- **HTTP status codes** are mapped to appropriate error codes
- **Rate limiting** includes retry information in details
- **Frontend** can reliably parse and handle all error types
