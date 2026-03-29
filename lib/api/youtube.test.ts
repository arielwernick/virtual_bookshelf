import { describe, it, expect } from 'vitest';
import { extractVideoId, extractChannelIdentifier } from './youtube';

describe('YouTube API - extractVideoId', () => {
  describe('Valid URLs', () => {
    it('extracts ID from standard youtube.com/watch?v= URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtube.com/watch?v= without www', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtube.com/embed/ URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtube.com/shorts/ URL', () => {
      const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID with additional query parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=abc';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtu.be with query parameters', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ?t=10';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });
  });

  describe('Invalid URLs', () => {
    it('returns null for non-YouTube URL', () => {
      const url = 'https://example.com/video';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for YouTube homepage', () => {
      const url = 'https://www.youtube.com';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for YouTube channel URL', () => {
      const url = 'https://www.youtube.com/channel/UCxyz';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for malformed URL', () => {
      const url = 'not a url';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for YouTube watch URL without v parameter', () => {
      const url = 'https://www.youtube.com/watch';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractVideoId('')).toBeNull();
    });

    it('returns null for malicious URL with youtube.com in query', () => {
      const url = 'https://evil.com?youtube.com';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for malicious URL with youtube.com in path', () => {
      const url = 'https://evil.com/youtube.com/watch?v=abc';
      expect(extractVideoId(url)).toBeNull();
    });

    it('returns null for URL with youtube.com subdomain of evil domain', () => {
      const url = 'https://youtube.com.evil.com/watch?v=abc';
      expect(extractVideoId(url)).toBeNull();
    });
  });
});

describe('YouTube API - extractChannelIdentifier', () => {
  describe('Valid channel URLs', () => {
    it('extracts handle from @username format', () => {
      const url = 'https://www.youtube.com/@AltonBrown';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'handle', value: 'AltonBrown' });
    });

    it('extracts handle from @username format without www', () => {
      const url = 'https://youtube.com/@TechChannel';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'handle', value: 'TechChannel' });
    });

    it('extracts handle from @username with trailing slash', () => {
      const url = 'https://www.youtube.com/@AltonBrown/';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'handle', value: 'AltonBrown' });
    });

    it('extracts handle from @username with path segments', () => {
      const url = 'https://www.youtube.com/@AltonBrown/videos';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'handle', value: 'AltonBrown' });
    });

    it('extracts username from /c/ChannelName format', () => {
      const url = 'https://www.youtube.com/c/SomeChannel';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'username', value: 'SomeChannel' });
    });

    it('extracts username from /c/ format without www', () => {
      const url = 'https://youtube.com/c/AnotherChannel';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'username', value: 'AnotherChannel' });
    });

    it('extracts username from /c/ with trailing slash', () => {
      const url = 'https://www.youtube.com/c/TestChannel/';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'username', value: 'TestChannel' });
    });

    it('extracts channel ID from /channel/ID format', () => {
      const url = 'https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'id', value: 'UCuAXFkgsw1L7xaCfnd5JJOw' });
    });

    it('extracts channel ID from /channel/ without www', () => {
      const url = 'https://youtube.com/channel/UCxyz123';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'id', value: 'UCxyz123' });
    });

    it('extracts channel ID from /channel/ with trailing slash', () => {
      const url = 'https://www.youtube.com/channel/UCabc456/';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'id', value: 'UCabc456' });
    });

    it('extracts channel ID from /channel/ with path segments', () => {
      const url = 'https://www.youtube.com/channel/UCdef789/featured';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'id', value: 'UCdef789' });
    });

    it('works with m.youtube.com domain', () => {
      const url = 'https://m.youtube.com/@MobileChannel';
      const result = extractChannelIdentifier(url);
      expect(result).toEqual({ type: 'handle', value: 'MobileChannel' });
    });
  });

  describe('Invalid channel URLs', () => {
    it('returns null for non-YouTube URL', () => {
      const url = 'https://example.com/@username';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for YouTube video URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for YouTube homepage', () => {
      const url = 'https://www.youtube.com';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for malformed URL', () => {
      const url = 'not a url';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractChannelIdentifier('')).toBeNull();
    });

    it('returns null for @ without username', () => {
      const url = 'https://www.youtube.com/@';
      const result = extractChannelIdentifier(url);
      expect(result).toBeNull();
    });

    it('returns null for /c/ without channel name', () => {
      const url = 'https://www.youtube.com/c/';
      const result = extractChannelIdentifier(url);
      expect(result).toBeNull();
    });

    it('returns null for /channel/ without ID', () => {
      const url = 'https://www.youtube.com/channel/';
      const result = extractChannelIdentifier(url);
      expect(result).toBeNull();
    });

    it('returns null for malicious URL with youtube.com in path', () => {
      const url = 'https://evil.com/youtube.com/@fake';
      expect(extractChannelIdentifier(url)).toBeNull();
    });

    it('returns null for URL with youtube.com subdomain of evil domain', () => {
      const url = 'https://youtube.com.evil.com/@fake';
      expect(extractChannelIdentifier(url)).toBeNull();
    });
  });
});
