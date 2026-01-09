/**
 * Shared mock factories for testing
 * 
 * This file contains factory functions for creating mock data objects
 * that are commonly used across multiple test files.
 */

import { Item, Shelf, User, ShelfType, ItemType } from '@/lib/types/shelf';

/**
 * Creates a mock Item with default values that can be overridden
 * 
 * @param overrides - Partial Item object to override default values
 * @returns Complete Item object with defaults + overrides
 */
export function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    image_url: null,
    external_url: null,
    notes: null,
    rating: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock Shelf with default values that can be overridden
 * 
 * @param overrides - Partial Shelf object to override default values
 * @returns Complete Shelf object with defaults + overrides
 */
export function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'My Shelf',
    description: null,
    share_token: 'share-token-123',
    is_public: false,
    shelf_type: 'standard' as ShelfType,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock User with default values that can be overridden
 * 
 * @param overrides - Partial User object to override default values
 * @returns Complete User object with defaults + overrides
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    google_id: null,
    share_token: 'user-share-token',
    description: null,
    title: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock Request object for API route testing
 * 
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Optional request body (will be JSON stringified)
 * @param url - Optional URL (defaults to http://localhost:3000/api/test)
 * @returns Request object
 */
export function createMockRequest(
  method: string,
  body?: object,
  url: string = 'http://localhost:3000/api/test'
): Request {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new Request(url, options);
}

/**
 * Simple helper to create a POST request (common pattern in tests)
 * 
 * @param body - Request body
 * @param url - Optional URL
 * @returns Request object
 */
export function createRequest(body: object, url: string = 'http://localhost:3000/api/test'): Request {
  return createMockRequest('POST', body, url);
}

/**
 * Creates a mock params object for Next.js dynamic routes (generic)
 * Returns just the params object wrapped in a Promise
 * 
 * @param params - Key-value pairs for route parameters
 * @returns Promise resolving to params object
 * @example
 * const params = await createMockParams({ id: '123' });
 */
export function createMockParams<T extends Record<string, string>>(params: T): Promise<T> {
  return Promise.resolve(params);
}

/**
 * Creates Next.js route context with params for shelf routes
 * Returns the full context object structure expected by Next.js route handlers
 * This is a convenience wrapper around createMockParams for the common shelf ID pattern
 * 
 * @param shelfId - Shelf ID for the route parameter (default: 'shelf-1')
 * @returns Object with params Promise (for use as second arg to route handlers)
 * @example
 * await GET(request, createParams('my-shelf'));
 */
export function createParams(shelfId: string = 'shelf-1') {
  return { params: Promise.resolve({ shelfId }) };
}
