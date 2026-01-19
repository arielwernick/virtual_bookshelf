// TypeScript types for Virtual Bookshelf

export interface User {
  id: string;
  username: string | null;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  share_token: string;
  description: string | null;
  title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  share_token: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ItemType = 'book' | 'podcast' | 'music' | 'podcast_episode' | 'video' | 'link';

export interface Item {
  id: string;
  shelf_id: string;
  user_id: string | null;
  type: ItemType;
  title: string;
  creator: string;
  image_url: string | null;
  external_url: string | null;
  notes: string | null;
  rating: number | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

// Shelf with associated items (for optimized queries)
export interface ShelfWithItems {
  shelf: Shelf;
  items: Item[];
}

// Public-facing shelf data (without sensitive user info)
export interface ShelfData {
  username: string | null;
  description: string | null;
  title: string | null;
  items: Item[];
  created_at: Date;
}

// For creating new items
export interface CreateItemData {
  type: ItemType;
  title: string;
  creator: string;
  image_url?: string;
  external_url?: string;
  notes?: string;
  rating?: number;
  order_index?: number;
}

// For updating existing items
export interface UpdateItemData {
  title?: string;
  creator?: string;
  image_url?: string;
  external_url?: string;
  notes?: string;
  rating?: number;
  order_index?: number;
}

// Episode-related types
export interface EpisodeSearchResult {
  id: string;
  title: string;
  description: string;
  duration_ms: number;
  release_date: string;
  imageUrl: string;
  externalUrl: string;
  showName: string;
}

// Error codes enum for standardized API errors
export enum ErrorCode {
  // Authentication errors (401)
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors (400)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

// Standardized error object
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  // Deprecated: keeping for backward compatibility during migration
  message?: string;
}
