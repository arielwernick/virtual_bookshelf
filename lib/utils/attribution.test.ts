import { describe, it, expect } from 'vitest';
import {
  normalizeReferrer,
  buildAttributionCookieValue,
  parseAttributionCookie,
  classifyAttribution,
} from './attribution';

describe('normalizeReferrer', () => {
  it('keeps origin and path, dropping query and fragment', () => {
    expect(normalizeReferrer('https://www.google.com/search?q=bookshelf#top')).toBe(
      'https://www.google.com/search'
    );
  });

  it('returns bare origin for root referrers', () => {
    expect(normalizeReferrer('https://www.google.com/')).toBe('https://www.google.com');
  });

  it('ignores same-site referrers', () => {
    expect(normalizeReferrer('https://virtualbookshelf.app/login', 'virtualbookshelf.app')).toBeNull();
  });

  it('rejects empty, invalid, and non-http referrers', () => {
    expect(normalizeReferrer('')).toBeNull();
    expect(normalizeReferrer('not a url')).toBeNull();
    expect(normalizeReferrer('javascript:alert(1)')).toBeNull();
  });

  it('truncates very long referrers', () => {
    const long = `https://example.com/${'a'.repeat(1000)}`;
    expect(normalizeReferrer(long)!.length).toBe(500);
  });
});

describe('buildAttributionCookieValue / parseAttributionCookie', () => {
  it('round-trips referrer and UTM params', () => {
    const value = buildAttributionCookieValue(
      'https://virtualbookshelf.app/?utm_source=Newsletter&utm_medium=email&utm_campaign=launch',
      'https://www.google.com/'
    );

    expect(parseAttributionCookie(value)).toEqual({
      firstReferrer: 'https://www.google.com',
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'launch',
    });
  });

  it('records a direct visit as an empty attribution', () => {
    const value = buildAttributionCookieValue('https://virtualbookshelf.app/', '');

    expect(parseAttributionCookie(value)).toEqual({
      firstReferrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    });
  });

  it('ignores internal navigation as a referrer', () => {
    const value = buildAttributionCookieValue(
      'https://virtualbookshelf.app/signup',
      'https://virtualbookshelf.app/'
    );

    expect(parseAttributionCookie(value)?.firstReferrer).toBeNull();
  });
});

describe('parseAttributionCookie', () => {
  it('returns null for missing or malformed cookies', () => {
    expect(parseAttributionCookie(undefined)).toBeNull();
    expect(parseAttributionCookie('%E0%A4%A')).toBeNull();
    expect(parseAttributionCookie('not-json')).toBeNull();
    expect(parseAttributionCookie(encodeURIComponent('[1,2]'))).toBeNull();
    expect(parseAttributionCookie(encodeURIComponent('null'))).toBeNull();
  });

  it('re-validates tampered fields', () => {
    const tampered = encodeURIComponent(
      JSON.stringify({ r: 'javascript:alert(1)', us: 42, um: 'x'.repeat(500), uc: '  ' })
    );

    expect(parseAttributionCookie(tampered)).toEqual({
      firstReferrer: null,
      utmSource: null,
      utmMedium: 'x'.repeat(100),
      utmCampaign: null,
    });
  });
});

describe('classifyAttribution', () => {
  it('labels users created before tracking', () => {
    expect(classifyAttribution(null, null, false)).toBe('Before tracking');
  });

  it('prefers UTM source over referrer', () => {
    expect(classifyAttribution('https://www.google.com', 'newsletter')).toBe('Campaign: newsletter');
  });

  it('treats no referrer as direct', () => {
    expect(classifyAttribution(null, null)).toBe('Direct');
  });

  it('recognizes search engines including country domains', () => {
    expect(classifyAttribution('https://www.google.com', null)).toBe('Google');
    expect(classifyAttribution('https://www.google.co.uk', null)).toBe('Google');
    expect(classifyAttribution('https://www.bing.com', null)).toBe('Bing');
    expect(classifyAttribution('https://duckduckgo.com', null)).toBe('DuckDuckGo');
  });

  it('recognizes AI assistants before search engines', () => {
    expect(classifyAttribution('https://gemini.google.com', null)).toBe('Gemini');
    expect(classifyAttribution('https://chatgpt.com', null)).toBe('ChatGPT');
  });

  it('recognizes social sites', () => {
    expect(classifyAttribution('https://t.co', null)).toBe('X / Twitter');
    expect(classifyAttribution('https://www.reddit.com/r/books', null)).toBe('Reddit');
  });

  it('falls back to the referring host', () => {
    expect(classifyAttribution('https://www.someblog.dev/post', null)).toBe('someblog.dev');
  });
});
