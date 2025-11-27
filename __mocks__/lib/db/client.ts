import { vi } from 'vitest';

// Mock SQL tagged template function
// This mock captures the template literal and values, returning a controllable promise
export const mockSql = vi.fn();

// Export sql as the mock function - it will be called as a tagged template literal
export const sql = mockSql;

// Helper to reset the mock between tests
export function resetSqlMock() {
  mockSql.mockReset();
}

// Helper to set up a mock response
export function mockSqlResponse(response: unknown[]) {
  mockSql.mockResolvedValueOnce(response);
}

// Helper to set up a mock error
export function mockSqlError(error: Error) {
  mockSql.mockRejectedValueOnce(error);
}
