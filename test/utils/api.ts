/**
 * API mocking helpers for testing
 * 
 * This file provides utilities for mocking fetch API calls and API responses
 * commonly used in component and integration tests.
 */

import { vi } from 'vitest';
import { ApiResponse } from '@/lib/types/shelf';

/**
 * Sets up global.fetch as a Vitest mock
 * Should be called in beforeEach to ensure clean state
 * 
 * @returns Mocked fetch function
 */
export function setupFetchMock(): typeof global.fetch {
  global.fetch = vi.fn();
  return global.fetch;
}

/**
 * Creates a mock successful Response object
 * 
 * @param data - Data to return in the response
 * @returns Mock Response object
 */
export function mockSuccessfulResponse<T>(data?: T): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data } as ApiResponse<T>),
  } as Response;
}

/**
 * Creates a mock error Response object
 * 
 * @param error - Error message
 * @param status - HTTP status code (default: 400)
 * @returns Mock Response object
 */
export function mockErrorResponse(error: string, status: number = 400): Response {
  return {
    ok: false,
    status,
    json: async () => ({ success: false, error } as ApiResponse),
  } as Response;
}

/**
 * Mocks a successful fetch call with the given data
 * 
 * @param data - Data to return in the response
 */
export function mockFetchSuccess<T>(data?: T): void {
  vi.mocked(global.fetch).mockResolvedValueOnce(mockSuccessfulResponse(data));
}

/**
 * Mocks a failed fetch call with the given error
 * 
 * @param error - Error message
 * @param status - HTTP status code (default: 400)
 */
export function mockFetchError(error: string, status: number = 400): void {
  vi.mocked(global.fetch).mockResolvedValueOnce(mockErrorResponse(error, status));
}

/**
 * Resets the fetch mock
 * Should be called in beforeEach or afterEach for test isolation
 */
export function resetFetchMock(): void {
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    vi.mocked(global.fetch).mockReset();
  }
}
