// TypeScript types for Virtual Bookshelf

// User account (can own multiple shelves)
export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// Shelf (owned by a user, contains items)
export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  share_token: string;
  description: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ItemType = 'book' | 'podcast' | 'music';

export interface Item {
  id: string;
  shelf_id: string;
  type: ItemType;
  title: string;
  creator: string;
  image_url: string | null;
  external_url: string | null;
  notes: string | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

// Public-facing shelf data (without sensitive user info)
export interface ShelfData {
  username: string;
  shelfName: string;
  description: string | null;
  items: Item[];
  share_token?: string;
  created_at: Date;
}

// For creating new shelves
export interface CreateShelfData {
  name: string;
  description?: string;
  is_default?: boolean;
}

// For updating existing shelves
export interface UpdateShelfData {
  name?: string;
  description?: string;
}

// For creating new items
export interface CreateItemData {
  type: ItemType;
  title: string;
  creator: string;
  image_url?: string;
  external_url?: string;
  notes?: string;
  order_index?: number;
}

// For updating existing items
export interface UpdateItemData {
  title?: string;
  creator?: string;
  image_url?: string;
  external_url?: string;
  notes?: string;
  order_index?: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
