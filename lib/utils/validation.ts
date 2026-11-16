import { ItemType } from '../types/shelf';

/**
 * Normalize and validate username
 */
export function validateUsername(username: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = username.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Username must be 50 characters or less' };
  }
  
  // Only allow alphanumeric and hyphens/underscores
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { valid: true, normalized: trimmed };
}

/**
 * Validate email
 */
export function validateEmail(email: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, error: 'Email must be 255 characters or less' };
  }
  
  // Basic email regex validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, normalized: trimmed };
}

/**
 * Validate password
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length === 0) {
    return { valid: false, error: 'Password cannot be empty' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Password must be 100 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Validate item type
 */
export function validateItemType(type: string): { valid: boolean; error?: string } {
  const validTypes: ItemType[] = ['book', 'podcast', 'music', 'podcast_episode', 'video', 'link', 'stock'];
  
  if (!validTypes.includes(type as ItemType)) {
    return { valid: false, error: `Type must be one of: ${validTypes.join(', ')}` };
  }
  
  return { valid: true };
}

/**
 * Validate title/creator
 */
export function validateText(text: string, fieldName: string, maxLength: number = 255): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be ${maxLength} characters or less` };
  }
  
  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string, fieldName: string = 'URL'): { valid: boolean; error?: string } {
  if (url.length === 0) {
    return { valid: true }; // URLs are optional
  }
  
  if (url.length > 2048) {
    return { valid: false, error: `${fieldName} must be 2048 characters or less` };
  }
  
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: `${fieldName} must use http or https protocol` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `${fieldName} must be a valid URL` };
  }
}

/** Longest URL the app stores. */
export const MAX_URL_LENGTH = 2048;

/**
 * Return the URL if it is a web address that is safe to store and link to,
 * otherwise null.
 *
 * Only http and https are accepted. Anything else (javascript:, data:, file:,
 * a bare string) could end up in an href or in structured data, so it is
 * never stored. Every path that writes an item's link or image goes through
 * this, and createItem / updateItem apply it again as a last line (issue #296).
 */
export function safeHttpUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Validate notes
 */
export function validateNotes(notes: string): { valid: boolean; error?: string } {
  if (notes.length === 0) {
    return { valid: true }; // Notes are optional
  }
  
  if (notes.length > 500) {
    return { valid: false, error: 'Notes must be 500 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Validate rating
 */
export function validateRating(rating: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be a whole number' };
  }
  
  if (rating < 0 || rating > 5) {
    return { valid: false, error: 'Rating must be between 0 and 5 stars' };
  }
  
  return { valid: true };
}
