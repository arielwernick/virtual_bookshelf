/**
 * Item Type Detector Utility
 * 
 * Detects the item type (book, podcast, music, link) from a URL
 * based on domain and path patterns.
 */

import { ItemType } from '@/lib/types/shelf';

interface DomainPattern {
  domains: string[];
  pathPatterns?: RegExp[];
  type: ItemType;
}

/**
 * Domain and path patterns for detecting item types
 */
const TYPE_PATTERNS: DomainPattern[] = [
  // Podcast platforms
  {
    domains: [
      'podcasts.apple.com',
      'itunes.apple.com', // podcasts
    ],
    pathPatterns: [/\/podcast\//i],
    type: 'podcast',
  },
  {
    domains: ['spotify.com', 'open.spotify.com'],
    pathPatterns: [/\/show\//i, /\/episode\//i],
    type: 'podcast',
  },
  {
    domains: [
      'pocketcasts.com',
      'overcast.fm',
      'castro.fm',
      'podcasts.google.com',
    ],
    type: 'podcast',
  },

  // Music platforms
  {
    domains: ['spotify.com', 'open.spotify.com'],
    pathPatterns: [/\/track\//i, /\/album\//i, /\/artist\//i, /\/playlist\//i],
    type: 'music',
  },
  {
    domains: [
      'music.apple.com',
      'itunes.apple.com', // music
      'soundcloud.com',
      'bandcamp.com',
      'tidal.com',
      'deezer.com',
      'music.youtube.com',
    ],
    type: 'music',
  },

  // Book platforms - domain only (no path patterns needed)
  {
    domains: [
      'goodreads.com',
      'bookshop.org',
      'barnesandnoble.com',
      'books.google.com',
      'openlibrary.org',
      'librarything.com',
      'audible.com',
    ],
    type: 'book',
  },
  
  // Amazon - needs path patterns to distinguish books from other products
  {
    domains: [
      'amazon.com',
      'amazon.co.uk',
      'amazon.ca',
      'amazon.de',
    ],
    pathPatterns: [/\/book\//i, /\/dp\//i, /\/gp\/product\//i],
    type: 'book',
  },
  
  // Video platforms default to link type
  {
    domains: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com'],
    type: 'link',
  },
];

/**
 * Detect item type from a URL
 * 
 * @param url - The URL to analyze
 * @returns The detected item type, defaults to 'link' if unknown
 */
export function detectItemType(url: string): ItemType {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsedUrl.pathname;

    for (const pattern of TYPE_PATTERNS) {
      // Check if domain matches
      const domainMatches = pattern.domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (domainMatches) {
        // If there are path patterns, check them
        if (pattern.pathPatterns && pattern.pathPatterns.length > 0) {
          const pathMatches = pattern.pathPatterns.some((regex) => regex.test(pathname));
          if (pathMatches) {
            return pattern.type;
          }
          // If path patterns exist but don't match, continue to next pattern
          // (same domain might have different types based on path)
          continue;
        }
        
        // No path patterns = domain-only match
        return pattern.type;
      }
    }

    // Default to 'link' for unknown URLs
    return 'link';
  } catch {
    // Invalid URL, default to link
    return 'link';
  }
}

/**
 * Detect types for multiple URLs
 * 
 * @param urls - Array of URLs to analyze
 * @returns Map from URL to detected type
 */
export function detectItemTypes(urls: string[]): Record<string, ItemType> {
  const result: Record<string, ItemType> = {};
  
  for (const url of urls) {
    result[url] = detectItemType(url);
  }
  
  return result;
}
