import { describe, it, expect } from 'vitest';
import { describeShelfForSearch, formatShelfDate } from './shelfSummary';

describe('describeShelfForSearch', () => {
  it('uses the owner description, cut at 150 characters', () => {
    expect(describeShelfForSearch('What I hand to friends', ['A'])).toBe('What I hand to friends');
    expect(describeShelfForSearch('x'.repeat(200), [])).toBe(`${'x'.repeat(150)}...`);
  });

  it('names the first three items when there is no description', () => {
    expect(describeShelfForSearch(null, ['Deep Work'])).toBe('A shelf with Deep Work.');
    expect(describeShelfForSearch('', ['Deep Work', 'Dune'])).toBe('A shelf with Deep Work and Dune.');
    expect(describeShelfForSearch('  ', ['A', 'B', 'C', 'D', 'E'])).toBe('A shelf with A, B and C, plus 2 more.');
  });

  it('falls back to a count when titles are very long', () => {
    const long = 'A very long title '.repeat(8);
    expect(describeShelfForSearch(null, [long, long, long])).toBe('A shelf of 3 items on Virtual Bookshelf');
  });

  it('handles an empty shelf', () => {
    expect(describeShelfForSearch(null, [])).toBe('An empty shelf on Virtual Bookshelf');
  });
});

describe('formatShelfDate', () => {
  it('formats in UTC regardless of the time of day', () => {
    expect(formatShelfDate(new Date('2026-11-01T23:59:00Z'))).toBe('Nov 1, 2026');
    expect(formatShelfDate('2026-11-01T00:00:00Z')).toBe('Nov 1, 2026');
  });
});
