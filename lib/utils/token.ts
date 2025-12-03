import crypto from 'crypto';

/**
 * Characters used for short token generation
 * URL-safe alphabet: A-Z, a-z, 0-9 (no confusing chars like 0/O, 1/l/I)
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Generate a short, URL-safe token for share links
 * 
 * @param length - Token length (default: 8)
 *   - 8 chars = 62^8 = ~218 trillion combinations
 *   - Collision probability negligible for typical usage
 * 
 * @returns A random alphanumeric string
 * 
 * @example
 * generateShortToken() // "Xk9mP2vL"
 * generateShortToken(10) // "Xk9mP2vLnQ"
 */
export function generateShortToken(length: number = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  
  return result;
}
