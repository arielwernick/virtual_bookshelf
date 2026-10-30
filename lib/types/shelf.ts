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
  signup_source: SignupSource | null;
  first_referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  last_seen_at: Date | null;
  welcome_sent_at: Date | null;
  marketing_opt_out: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SignupSource = 'email' | 'google';

/** First-touch attribution captured before signup and stored on the user. */
export interface SignupAttribution {
  firstReferrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
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

export type ItemType = 'book' | 'podcast' | 'music' | 'podcast_episode' | 'video' | 'link' | 'stock';

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

// Minimal item fields needed to render a shelf preview (dashboard library view)
export interface ShelfPreviewItem {
  id: string;
  type: ItemType;
  title: string;
  creator: string;
  image_url: string | null;
}

// Shelf plus total item count and leading items, for the dashboard library view
export interface DashboardShelf extends Shelf {
  item_count: number;
  preview_items: ShelfPreviewItem[];
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

// For updating existing items (null clears a nullable column)
export interface UpdateItemData {
  title?: string;
  creator?: string;
  image_url?: string;
  external_url?: string;
  notes?: string | null;
  rating?: number | null;
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

// OAuth authorization server types (MCP connector)
export interface OAuthClient {
  id: string;
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  created_at: Date;
}

export interface OAuthAuthorizationCode {
  id: string;
  code_hash: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  expires_at: Date;
  created_at: Date;
}

export interface OAuthAccessToken {
  id: string;
  token_hash: string;
  client_id: string;
  user_id: string;
  scope: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
}

// Admin dashboard types
export interface AdminOverview {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  active_users_7d: number;
  active_users_30d: number;
  activated_users: number;
}

export interface AdminWeeklySignups {
  week: Date;
  email: number;
  google: number;
}

export interface AdminAttributionRow {
  tracked: boolean;
  first_referrer: string | null;
  utm_source: string | null;
  count: number;
}

export interface AdminRecentUser {
  id: string;
  username: string | null;
  email: string;
  signup_method: SignupSource;
  /** False for users created before attribution tracking existed. */
  tracked: boolean;
  first_referrer: string | null;
  utm_source: string | null;
  created_at: Date;
  last_seen_at: Date | null;
  shelf_count: number;
  item_count: number;
  activated: boolean;
  public_share_token: string | null;
}
