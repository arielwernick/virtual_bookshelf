import { describe, it, expect } from 'vitest';
import { extractUrls, parseTextWithContext, validateParseResults } from './textParser';

// ============================================================================
// extractUrls Tests
// ============================================================================

describe('extractUrls', () => {
  it('extracts http URLs', () => {
    const text = 'Check out http://example.com for more info';
    const result = extractUrls(text);
    expect(result).toEqual(['http://example.com']);
  });

  it('extracts https URLs', () => {
    const text = 'Visit https://secure.example.com/page';
    const result = extractUrls(text);
    expect(result).toEqual(['https://secure.example.com/page']);
  });

  it('extracts URLs with query params', () => {
    const text = 'Link: https://example.com/search?q=test&page=1';
    const result = extractUrls(text);
    expect(result).toEqual(['https://example.com/search?q=test&page=1']);
  });

  it('extracts URLs with fragments', () => {
    const text = 'See https://example.com/page#section-2';
    const result = extractUrls(text);
    expect(result).toEqual(['https://example.com/page#section-2']);
  });

  it('extracts multiple URLs in order', () => {
    const text = 'First https://first.com then https://second.com';
    const result = extractUrls(text);
    expect(result).toEqual(['https://first.com', 'https://second.com']);
  });

  it('deduplicates identical URLs', () => {
    const text = 'Same link https://example.com and again https://example.com';
    const result = extractUrls(text);
    expect(result).toEqual(['https://example.com']);
  });

  it('deduplicates URLs case-insensitively', () => {
    const text = 'Links: https://Example.COM and HTTPS://EXAMPLE.com';
    const result = extractUrls(text);
    expect(result).toHaveLength(1);
  });

  it('removes trailing punctuation from URLs', () => {
    const text = 'Check this out: https://example.com.';
    const result = extractUrls(text);
    expect(result).toEqual(['https://example.com']);
  });

  it('removes trailing comma from URLs', () => {
    const text = 'Links: https://first.com, https://second.com.';
    const result = extractUrls(text);
    expect(result).toEqual(['https://first.com', 'https://second.com']);
  });

  it('handles LinkedIn shortened URLs (lnkd.in)', () => {
    const text = 'Check out https://lnkd.in/abc123';
    const result = extractUrls(text);
    expect(result).toEqual(['https://lnkd.in/abc123']);
  });

  it('handles bit.ly shortened URLs', () => {
    const text = 'Link: https://bit.ly/3xYz123';
    const result = extractUrls(text);
    expect(result).toEqual(['https://bit.ly/3xYz123']);
  });

  it('handles t.co shortened URLs', () => {
    const text = 'Read more: https://t.co/AbCdEf123';
    const result = extractUrls(text);
    expect(result).toEqual(['https://t.co/AbCdEf123']);
  });

  it('returns empty array for text without URLs', () => {
    const text = 'No links here, just plain text.';
    const result = extractUrls(text);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractUrls('')).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(extractUrls(null as unknown as string)).toEqual([]);
    expect(extractUrls(undefined as unknown as string)).toEqual([]);
  });

  it('handles URLs with complex paths', () => {
    const text = 'Article: https://medium.com/@user/my-article-title-abc123def456';
    const result = extractUrls(text);
    expect(result).toEqual(['https://medium.com/@user/my-article-title-abc123def456']);
  });

  it('handles URLs with ports', () => {
    const text = 'Dev server at http://localhost:3000/api/test';
    const result = extractUrls(text);
    expect(result).toEqual(['http://localhost:3000/api/test']);
  });
});

// ============================================================================
// parseTextWithContext Tests
// ============================================================================

describe('parseTextWithContext', () => {
  describe('LinkedIn post format', () => {
    it('parses LinkedIn post with numbered items and arrows', () => {
      const text = `1 → THE CODE
Scale at global level.
Teaches you how to code with AI and AI Agents
https://lnkd.in/dcibJhzQ

2 → Airbnb Tech Blog
Product engineering done right.
User focused systems.
https://airbnb.tech/blog/`;

      const result = parseTextWithContext(text);
      
      expect(result).toHaveLength(2);
      
      expect(result[0].url).toBe('https://lnkd.in/dcibJhzQ');
      expect(result[0].parsedTitle).toBe('THE CODE');
      expect(result[0].parsedDescription).toContain('Scale at global level');
      expect(result[0].order).toBe(0);
      
      expect(result[1].url).toBe('https://airbnb.tech/blog/');
      expect(result[1].parsedTitle).toBe('Airbnb Tech Blog');
      expect(result[1].parsedDescription).toContain('Product engineering done right');
      expect(result[1].order).toBe(1);
    });

    it('parses items with bullet points', () => {
      const text = `• Great Resource
A fantastic learning platform
https://example.com/resource

• Another Tool
Helps with productivity
https://example.com/tool`;

      const result = parseTextWithContext(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].parsedTitle).toBe('Great Resource');
      expect(result[1].parsedTitle).toBe('Another Tool');
    });
  });

  describe('edge cases', () => {
    it('handles URL with no preceding context', () => {
      const text = `https://example.com/standalone`;
      
      const result = parseTextWithContext(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/standalone');
      expect(result[0].parsedTitle).toBeUndefined();
      expect(result[0].parsedDescription).toBeUndefined();
    });

    it('handles multiple URLs on same line', () => {
      const text = `Check https://first.com and https://second.com`;
      
      const result = parseTextWithContext(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://first.com');
      expect(result[1].url).toBe('https://second.com');
    });

    it('returns empty array for text without URLs', () => {
      const text = 'No URLs in this text at all';
      const result = parseTextWithContext(text);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      expect(parseTextWithContext('')).toEqual([]);
    });

    it('returns empty array for null/undefined', () => {
      expect(parseTextWithContext(null as unknown as string)).toEqual([]);
      expect(parseTextWithContext(undefined as unknown as string)).toEqual([]);
    });

    it('handles URLs directly after each other', () => {
      const text = `https://first.com
https://second.com`;
      
      const result = parseTextWithContext(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://first.com');
      expect(result[1].url).toBe('https://second.com');
    });
  });

  describe('title extraction', () => {
    it('uses line with arrow as title', () => {
      const text = `Some intro text
Main Title → Important
More description here
https://example.com`;

      const result = parseTextWithContext(text);
      
      expect(result[0].parsedTitle).toBe('Main Title → Important');
    });

    it('strips numbering from title', () => {
      const text = `1. My Book Title
Great book about coding
https://example.com`;

      const result = parseTextWithContext(text);
      
      expect(result[0].parsedTitle).toBe('My Book Title');
    });

    it('strips emoji bullets', () => {
      const text = `📚 Learning Resource
For beginners
https://example.com`;

      const result = parseTextWithContext(text);
      
      // The emoji should be stripped
      expect(result[0].parsedTitle).not.toContain('📚');
    });
  });

  describe('order preservation', () => {
    it('maintains order of URLs', () => {
      const text = `First item https://first.com
Second item https://second.com
Third item https://third.com`;

      const result = parseTextWithContext(text);
      
      expect(result[0].order).toBe(0);
      expect(result[0].url).toBe('https://first.com');
      expect(result[1].order).toBe(1);
      expect(result[1].url).toBe('https://second.com');
      expect(result[2].order).toBe(2);
      expect(result[2].url).toBe('https://third.com');
    });
  });
});

// ============================================================================
// validateParseResults Tests
// ============================================================================

describe('validateParseResults', () => {
  it('accepts results under the limit', () => {
    const items = [
      { url: 'https://example.com', order: 0 },
      { url: 'https://example2.com', order: 1 },
    ];
    
    const result = validateParseResults(items, 50);
    
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.warning).toBeUndefined();
  });

  it('truncates results over the limit', () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      url: `https://example${i}.com`,
      order: i,
    }));
    
    const result = validateParseResults(items, 50);
    
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(50);
    expect(result.warning).toContain('60 links');
    expect(result.warning).toContain('first 50');
  });

  it('handles empty array', () => {
    const result = validateParseResults([], 50);
    
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.warning).toBeUndefined();
  });

  it('uses default limit of 50', () => {
    const items = Array.from({ length: 55 }, (_, i) => ({
      url: `https://example${i}.com`,
      order: i,
    }));
    
    const result = validateParseResults(items);
    
    expect(result.items).toHaveLength(50);
  });
});
