/**
 * Custom render utilities for React component testing
 * 
 * This file provides custom render functions with any necessary providers
 * or context wrappers that components might need.
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function for components
 * 
 * Currently a simple wrapper around @testing-library/react render.
 * Can be extended in the future to include providers, themes, or other context.
 * 
 * @param ui - React element to render
 * @param options - Optional render options
 * @returns RenderResult from @testing-library/react
 */
export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, options);
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };
