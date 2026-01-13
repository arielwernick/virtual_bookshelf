// Microlink API integration for URL metadata extraction
// https://microlink.io/docs/api/getting-started/overview

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('MicrolinkAPI');

export interface MicrolinkData {
  title: string;
  image: string | null;
  publisher: string;
  description: string | null;
  url: string;
}

interface MicrolinkResponse {
  status: 'success' | 'fail';
  data: {
    title?: string;
    description?: string;
    image?: {
      url: string;
    };
    publisher?: string;
    url?: string;
  };
  message?: string;
}

/**
 * Fetch metadata for any URL using Microlink API
 * Free tier: 50 requests/day
 * @param url - The URL to fetch metadata for
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 */
export async function fetchLinkMetadata(url: string, timeoutMs: number = 10000): Promise<MicrolinkData> {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('URL must use http or https protocol');
  }

  const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
  
  logger.info('Fetching link metadata', { url });

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error('Microlink API error', { 
        url, 
        status: response.status,
        statusText: response.statusText 
      });
      
      // Handle rate limiting / quota exceeded
      if (response.status === 429) {
        throw new Error('Daily API request limit reached. Please try again tomorrow or upgrade to a paid plan.');
      }
      
      // Handle other client errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error('Unable to fetch link preview. The URL may be invalid or inaccessible.');
      }
      
      throw new Error(`Failed to fetch link metadata: ${response.statusText}`);
    }

    const result: MicrolinkResponse = await response.json();

    if (result.status !== 'success') {
      logger.warn('Microlink returned non-success status', { url, message: result.message });
      throw new Error(result.message || 'Failed to extract metadata from URL');
    }

    const { data } = result;

    // Extract domain for fallback publisher name
    const domain = parsedUrl.hostname.replace(/^www\./, '');

    return {
      title: data.title || domain,
      image: data.image?.url || null,
      publisher: data.publisher || domain,
      description: data.description || null,
      url: data.url || url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Microlink API request timeout', { url, timeoutMs });
      throw new Error('Request timed out while fetching link preview. Please try again.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if a URL is a YouTube URL (to route to existing YouTube handler)
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be'
    );
  } catch {
    return false;
  }
}
