import { describe, it, expect } from 'vitest';
import {
  normalizeReferrer,
  buildAttributionCookieValue,
  parseAttributionCookie,
  classifyAttribution,
  cleanLandingPath,
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
      landingPath: '/',
    });
  });

  it('records a direct visit as an empty attribution', () => {
    const value = buildAttributionCookieValue('https://virtualbookshelf.app/', '');

    expect(parseAttributionCookie(value)).toEqual({
      firstReferrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPath: '/',
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
      landingPath: null,
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

  it('labels links a known site tagged with its own name as that site, not a campaign', () => {
    // ChatGPT adds utm_source=chatgpt.com to the links it cites
    expect(classifyAttribution(null, 'chatgpt.com')).toBe('ChatGPT');
    expect(classifyAttribution('https://chatgpt.com/', 'chatgpt.com')).toBe('ChatGPT');
    expect(classifyAttribution(null, 'ChatGPT')).toBe('ChatGPT');
    expect(classifyAttribution(null, 'perplexity')).toBe('Perplexity');
    expect(classifyAttribution(null, 'perplexity.ai')).toBe('Perplexity');
    expect(classifyAttribution(null, 'linkedin')).toBe('LinkedIn');
    expect(classifyAttribution(null, 'google')).toBe('Google');
  });

  it('keeps our own tags and unknown tags as campaigns', () => {
    expect(classifyAttribution(null, 'embed')).toBe('Campaign: embed');
    expect(classifyAttribution(null, 'shared_shelf')).toBe('Campaign: shared_shelf');
    expect(classifyAttribution(null, 'newsletter-nov')).toBe('Campaign: newsletter-nov');
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

describe('landing page', () => {
  it('records the first page, without its query string', () => {
    const cookie = buildAttributionCookieValue(
      'https://virtualbookshelf.app/goodreads-alternative?utm_source=chatgpt.com#faq',
      ''
    );
    expect(parseAttributionCookie(cookie)?.landingPath).toBe('/goodreads-alternative');
  });

  it.each([
    ['/s/my-books-Xk9mP2vL', '/s/*'],
    ['/embed/Xk9mP2vL', '/embed/*'],
    ['/shelf/123e4567-e89b-12d3-a456-426614174000/edit', '/shelf/*'],
    ['/oauth/authorize', '/oauth/*'],
  ])('never records a share token or private id: %s', (path, expected) => {
    expect(cleanLandingPath(path)).toBe(expected);
  });

  it('keeps ordinary pages and trims a trailing slash', () => {
    expect(cleanLandingPath('/')).toBe('/');
    expect(cleanLandingPath('/guides/reading-list/')).toBe('/guides/reading-list');
    expect(cleanLandingPath('/v/dQw4w9WgXcQ')).toBe('/v/dQw4w9WgXcQ');
  });

  it('rejects anything that is not a plain path, including tampered cookies', () => {
    expect(cleanLandingPath('https://evil.example/')).toBeNull();
    expect(cleanLandingPath('//evil.example')).toBeNull();
    expect(cleanLandingPath('/<script>')).toBeNull();
    expect(cleanLandingPath(42)).toBeNull();
    expect(cleanLandingPath(`/${'a'.repeat(500)}`)).toHaveLength(200);

    const tampered = encodeURIComponent(JSON.stringify({ l: 'javascript:alert(1)' }));
    expect(parseAttributionCookie(tampered)?.landingPath).toBeNull();
  });
});
