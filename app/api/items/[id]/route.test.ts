/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { createMockItem, createMockShelf, createMockRequest, createMockParams } from '@/test/utils/mocks';

vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getItemById: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  getShelfById: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getItemById, updateItem, getShelfById } from '@/lib/db/queries';

function createPatchRequest(body?: object): Request {
  return createMockRequest('PATCH', body, 'http://localhost:3000/api/items/item-1');
}

describe('PATCH /api/items/[id]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getItemById).mockReset();
    vi.mocked(updateItem).mockReset();
    vi.mocked(getShelfById).mockReset();
  });

  it('returns 400 when no fields are provided', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    vi.mocked(getItemById).mockResolvedValue(createMockItem());
    vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'user-1' }));

    const req = createPatchRequest({});
    const res = await PATCH(req, { params: createMockParams({ id: 'item-1' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No fields to update');
    expect(updateItem).not.toHaveBeenCalled();
  });
});
