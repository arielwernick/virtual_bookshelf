// Central color constants for OG images and other server-side assets
export const warmBrown = '#8b5f47';
export const mutedGold = '#d4921a';
export const warmCreamLight = '#fefcf8';
export const warmCream = '#f9f7f4';
export const richBrown = '#3d2518';
export const foreground = '#171717';
export const neutralMuted = '#6b7280';
export const amber700 = '#b45309';
export const amber800 = '#92400e';

// Gradients used in OG images
export const mainBackground = `linear-gradient(180deg, ${warmCreamLight} 0%, ${warmCream} 100%)`;
export const fallbackGradient = `linear-gradient(135deg, ${warmBrown} 0%, ${mutedGold} 100%)`;
export const shelfBarGradient = `linear-gradient(180deg, ${warmBrown} 0%, ${richBrown} 100%)`;
export const rankBadgeGradient = `linear-gradient(135deg, ${mutedGold} 0%, ${amber700} 100%)`;
export const errorFallback = `linear-gradient(135deg, ${richBrown} 0%, ${foreground} 100%)`;

export default {
  warmBrown,
  mutedGold,
  warmCreamLight,
  warmCream,
  richBrown,
  foreground,
  neutralMuted,
  mainBackground,
  fallbackGradient,
  shelfBarGradient,
  rankBadgeGradient,
  errorFallback,
};