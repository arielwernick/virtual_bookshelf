import { describe, it, expect } from 'vitest';
import { slugifyShelfName, buildShareSlug, buildSharePath, extractShareToken } from './slug';

describe('slugifyShelfName', () => {
  it('converts a simple name to kebab-case', () => {
    expect(slugifyShelfName('My Favorite Books')).toBe('my-favorite-books');
  });

  it('strips punctuation and collapses separators', () => {
    expect(slugifyShelfName("Ariel's Reads!! (2026 — vol. 2)")).toBe('ariel-s-reads-2026-vol-2');
  });

  it('removes diacritics', () => {
    expect(slugifyShelfName('Café Époque')).toBe('cafe-epoque');
  });

  it('returns empty string when no usable characters remain', () => {
    expect(slugifyShelfName('📚📚📚')).toBe('');
    expect(slugifyShelfName('   ')).toBe('');
  });

  it('truncates long names without a trailing hyphen', () => {
    const slug = slugifyShelfName('word '.repeat(30));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('buildShareSlug / buildSharePath', () => {
  it('appends the token after the slug', () => {
    expect(buildShareSlug('My Favorite Books', 'Xk9mP2vL')).toBe('my-favorite-books-Xk9mP2vL');
    expect(buildSharePath('My Favorite Books', 'Xk9mP2vL')).toBe('/s/my-favorite-books-Xk9mP2vL');
  });

  it('falls back to the bare token when the name has no usable slug', () => {
    expect(buildShareSlug('📚', 'Xk9mP2vL')).toBe('Xk9mP2vL');
    expect(buildSharePath('📚', 'Xk9mP2vL')).toBe('/s/Xk9mP2vL');
  });
});

describe('extractShareToken', () => {
  it('extracts the token from a slugged segment', () => {
    expect(extractShareToken('my-favorite-books-Xk9mP2vL')).toBe('Xk9mP2vL');
  });

  it('returns legacy slug-less tokens unchanged', () => {
    expect(extractShareToken('Xk9mP2vL')).toBe('Xk9mP2vL');
  });

  it('decodes percent-encoded segments', () => {
    expect(extractShareToken('caf%C3%A9-reads-Xk9mP2vL')).toBe('Xk9mP2vL');
  });

  it('tolerates malformed percent-encoding', () => {
    expect(extractShareToken('bad%2-Xk9mP2vL')).toBe('Xk9mP2vL');
  });

  it('round-trips buildShareSlug output', () => {
    expect(extractShareToken(buildShareSlug('Café Époque!!', 'abcd1234'))).toBe('abcd1234');
    expect(extractShareToken(buildShareSlug('📚', 'abcd1234'))).toBe('abcd1234');
  });
});
