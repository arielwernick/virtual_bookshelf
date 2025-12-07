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

export type ShelfType = 'standard' | 'top5';

export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  share_token: string;
  is_public: boolean;
  shelf_type: ShelfType;
  created_at: Date;
  updated_at: Date;
}

export type ItemType = 'book' | 'podcast' | 'music' | 'podcast_episode';

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
  order_index: number;
  created_at: Date;
  updated_at: Date;
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

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
