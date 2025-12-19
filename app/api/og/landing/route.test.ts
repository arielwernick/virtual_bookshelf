import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('OG landing route', () => {
  it('returns an ImageResponse without throwing', async () => {
    const res = await GET();
    expect(res).toBeDefined();
  });
});