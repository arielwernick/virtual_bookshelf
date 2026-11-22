import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getBookDetails } from '@/lib/api/bookDetails';

vi.mock('@/lib/api/bookDetails', () => ({ getBookDetails: vi.fn() }));
vi.mock('@/lib/utils/rateLimit', () => ({
  isRateLimitingEnabled: () => false,
  checkRateLimit: vi.fn(),
  getClientIP: () => '127.0.0.1',
  getExternalApiRateLimiter: vi.fn(),
}));

const mockGetBookDetails = vi.mocked(getBookDetails);
const request = (qs: string) => new Request(`http://localhost/api/books/details?${qs}`);

beforeEach(() => {
  mockGetBookDetails.mockReset();
});

describe('GET /api/books/details', () => {
  it('requires a title', async () => {
    const response = await GET(request('googleId=abc123'));
    expect(response.status).toBe(400);
    expect(mockGetBookDetails).not.toHaveBeenCalled();
  });

  it('returns details with a CDN cache header', async () => {
    mockGetBookDetails.mockResolvedValue({ year: 1965, pageCount: 605 });
    const response = await GET(request('title=Dune&author=Frank%20Herbert&googleId=B1hSG45JCX4C'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { year: 1965, pageCount: 605 } });
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(mockGetBookDetails).toHaveBeenCalledWith({
      title: 'Dune',
      author: 'Frank Herbert',
      googleVolumeId: 'B1hSG45JCX4C',
      openLibraryId: null,
    });
  });

  it('returns 500 when the lookup throws', async () => {
    mockGetBookDetails.mockRejectedValue(new Error('boom'));
    const response = await GET(request('title=Dune'));
    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
  });
});
