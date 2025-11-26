/**
 * Button Hover Enhancement Utilities
 * Implements Option C: Hybrid approach (color + scale/shadow)
 * - Color change for immediate feedback
 * - Subtle scale/shadow for depth and polish
 * - Consistent animation speed across all buttons
 */

// Animation speed: medium (300ms) for balanced feel
const ANIMATION_SPEED = 'duration-300';

export const buttonHoverClasses = {
  // Primary buttons (filled dark background)
  primary: `hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all ${ANIMATION_SPEED} active:scale-95`,

  // Secondary buttons (filled light background)
  secondary: `hover:bg-gray-200 hover:shadow-sm hover:scale-105 transition-all ${ANIMATION_SPEED} active:scale-95`,

  // Outlined buttons (border only)
  outlined: `hover:border-gray-400 hover:shadow-sm hover:scale-105 transition-all ${ANIMATION_SPEED} active:scale-95`,

  // Icon/Danger buttons (red)
  danger: `hover:bg-red-700 hover:shadow-md hover:scale-105 transition-all ${ANIMATION_SPEED} active:scale-95`,

  // Type selector buttons (for AddItemForm)
  typeSelector: `transition-all ${ANIMATION_SPEED} hover:shadow-sm hover:scale-102`,

  // Link/Text buttons (minimal)
  link: `hover:text-gray-700 transition-all ${ANIMATION_SPEED}`,
};

export const disabledButtonClasses = `opacity-50 cursor-not-allowed hover:scale-100`;

/**
 * Utility to build complete button className with hover effects
 * @param variant - Button variant (primary, secondary, outlined, danger, etc.)
 * @param isDisabled - Whether button is disabled
 * @param additionalClasses - Any additional custom classes
 */
export function getButtonClassName(
  variant: keyof typeof buttonHoverClasses = 'primary',
  isDisabled = false,
  additionalClasses = ''
): string {
  const baseHover = buttonHoverClasses[variant];
  const disabledClass = isDisabled ? disabledButtonClasses : '';
  return `${baseHover} ${disabledClass} ${additionalClasses}`.trim();
}
