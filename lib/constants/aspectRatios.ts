import { ItemType } from '@/lib/types/shelf';

/**
 * Aspect ratio configuration by content type
 *
 * Books are scaled to 2:2.55 (15% compact) for better shelf presentation
 * compared to the standard 2:3 book cover proportion.
 */
export const ASPECT_RATIOS: Record<ItemType, string> = {
  book: '2/2.55',   // Portrait rectangle (optimized for shelf display)
  podcast: '1/1',   // Square (standard podcast artwork)
  music: '1/1',     // Square (standard album artwork)
};

/**
 * Get aspect ratio by item type
 */
export function getAspectRatio(type: ItemType): string {
  return ASPECT_RATIOS[type];
}

/**
 * Get aspect ratio as numeric value for calculations
 */
export function getAspectRatioNumeric(type: ItemType): number {
  const [width, height] = ASPECT_RATIOS[type].split('/').map(Number);
  return width / height;
}
