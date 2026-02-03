/**
 * Centralized error messages for consistent API responses
 */

// Authentication errors
export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: 'Not authenticated',
  UNAUTHORIZED: 'Unauthorized',
  INVALID_CREDENTIALS: 'Invalid username or password',
  INVALID_USERNAME: 'Invalid username',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_EMAIL: 'Invalid email address',
  USERNAME_TAKEN: 'Username already taken',
  EMAIL_REGISTERED: 'Email already registered',
  LOGIN_FAILED: 'Login failed',
  SIGNUP_FAILED: 'Signup failed',
  LOGOUT_FAILED: 'Logout failed',
  SESSION_FAILED: 'Failed to get session',
  GOOGLE_AUTH_REQUIRED: 'This account uses Google authentication. Please sign in with Google.',
  OAUTH_FAILED: 'Failed to initiate OAuth flow',
  OAUTH_MISSING_CODE: 'Missing authorization code or state',
  OAUTH_INVALID_STATE: 'Invalid state token',
} as const;

// Validation errors
export const VALIDATION_ERRORS = {
  SHELF_NAME_REQUIRED: 'Shelf name is required',
  SHELF_NAME_TOO_LONG: 'Shelf name must be 100 characters or less',
  DESCRIPTION_INVALID: 'Description must be a string',
  DESCRIPTION_TOO_LONG: 'Description must be 1000 characters or less',
  IS_PUBLIC_INVALID: 'is_public must be a boolean',
  NO_FIELDS_TO_UPDATE: 'No fields to update',
  ITEM_IDS_MUST_BE_ARRAY: 'item_ids must be an array',
  ITEM_IDS_EMPTY: 'item_ids cannot be empty',
  ITEM_IDS_MUST_BE_STRINGS: 'All item_ids must be strings',
  DUPLICATE_ITEM_IDS: 'Duplicate item IDs not allowed',
  TITLE_REQUIRED: 'Title is required',
  TYPE_REQUIRED: 'Type is required',
  INVALID_TYPE: 'Invalid item type',
} as const;

// Resource errors
export const RESOURCE_ERRORS = {
  SHELF_NOT_FOUND: 'Shelf not found',
  ITEM_NOT_FOUND: 'Item not found',
  USER_NOT_FOUND: 'User not found',
  ITEM_NOT_IN_SHELF: (itemId: string) => `Item ${itemId} does not belong to this shelf`,
  SHELF_NOT_YOURS: 'Unauthorized - shelf does not belong to you',
} as const;

// API operation errors
export const API_ERRORS = {
  FETCH_SHELF_FAILED: 'Failed to fetch shelf',
  UPDATE_SHELF_FAILED: 'Failed to update shelf',
  DELETE_SHELF_FAILED: 'Failed to delete shelf',
  CREATE_SHELF_FAILED: 'Failed to create shelf',
  REORDER_FAILED: 'Failed to reorder items',
  FETCH_ITEMS_FAILED: 'Failed to fetch items',
  CREATE_ITEM_FAILED: 'Failed to create item',
  UPDATE_ITEM_FAILED: 'Failed to update item',
  DELETE_ITEM_FAILED: 'Failed to delete item',
  SEARCH_FAILED: 'Search failed',
  IMPORT_FAILED: 'Import failed',
} as const;

// Type exports for type-safe error handling
export type AuthError = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];
export type ValidationError = typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS];
export type ResourceError = typeof RESOURCE_ERRORS[keyof typeof RESOURCE_ERRORS];
export type ApiError = typeof API_ERRORS[keyof typeof API_ERRORS];
