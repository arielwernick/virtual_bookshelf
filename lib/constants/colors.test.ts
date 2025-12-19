import { describe, it, expect } from 'vitest';
import { warmBrown, mutedGold, warmCreamLight, warmCream, richBrown, foreground, shelfBarGradient } from './colors';

describe('colors constants', () => {
  it('exports expected brand colors', () => {
    expect(warmBrown).toBe('#8b5f47');
    expect(mutedGold).toBe('#d4921a');
    expect(warmCreamLight).toBe('#fefcf8');
    expect(warmCream).toBe('#f9f7f4');
    expect(richBrown).toBe('#3d2518');
    expect(foreground).toBe('#171717');
  });

  it('exports gradients containing brand colors', () => {
    expect(shelfBarGradient).toContain('#8b5f47');
    expect(shelfBarGradient).toContain('#3d2518');
  });
});