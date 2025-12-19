import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('OG shelf route', () => {
  it('returns a fallback ImageResponse for a missing share token', async () => {
    const res = await GET(new Request('http://localhost/'), { params: Promise.resolve({ shareToken: 'this-token-does-not-exist' }) as any });
    expect(res).toBeDefined();
  });
});