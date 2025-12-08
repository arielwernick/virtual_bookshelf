import { describe, it, expect } from 'vitest';
import { extractVideoId } from './youtube';

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
