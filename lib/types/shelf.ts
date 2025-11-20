// TypeScript types for Virtual Bookshelf

export interface User {
  id: string;
  username: string;
  password_hash: string;
  share_token: string;
  description: string | null;
  title: string | null;
  created_at: Date;
  updated_at: Date;
}

export type ItemType = 'book' | 'podcast' | 'music';

export interface Item {
  id: string;
  user_id: string;
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
