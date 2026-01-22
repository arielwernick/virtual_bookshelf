/**
 * Image rendering utilities for dynamic fit and aspect ratio handling
 */

/**
 * Generate a stable, deterministic numeric hash from a string
 * Useful for consistent per-item variations like height jitter
 */
export function stableHash(input: string, max: number = 1000): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % max;
}

/**
 * Calculate a stable jitter value for an item based on its ID
 * Returns a value in the range [-maxVariance, +maxVariance]
 * Useful for creating subtle visual variation (e.g., book heights on shelves)
 */
export function calculateJitter(itemId: string, maxVariance: number): number {
  const normalized = stableHash(itemId, 1000) / 1000; // 0..1
  return (normalized - 0.5) * 2 * maxVariance; // -maxVariance..+maxVariance
}

/**
 * Determine if an image should use 'contain' or 'cover' object-fit
 * based on its natural aspect ratio vs container ratio
 */
export function getImageFitMode(
  naturalWidth: number,
  naturalHeight: number,
  containerRatio: number,
  options?: {
    extremeThreshold?: number;
  }
): 'cover' | 'contain' {
  const threshold = options?.extremeThreshold ?? 0.3; // 30% variance

  const naturalRatio = naturalWidth / naturalHeight;
  const lowerBound = containerRatio * (1 - threshold);
  const upperBound = containerRatio * (1 + threshold);

  // If image ratio is outside bounds, use contain to avoid cropping
  return naturalRatio < lowerBound || naturalRatio > upperBound ? 'contain' : 'cover';
}

/**
 * Parse aspect ratio string (e.g., "2/3") into a numeric value
 */
export function parseAspectRatio(ratioStr: string): number {
  try {
    const [width, height] = ratioStr.split('/').map(Number);
    return width / height;
  } catch {
    return 1;
  }
}

/**
 * Check if a URL hostname is Amazon-hosted
 */
export function isAmazonHostedImage(imageUrl: string): boolean {
  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    return host.includes('amazon') || host.includes('ssl-images-amazon.com');
  } catch {
    return false;
  }
}
