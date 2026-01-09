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
 */
export async function fetchLinkMetadata(url: string): Promise<MicrolinkData> {
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

  const response = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    logger.error('Microlink API error', { 
      url, 
      status: response.status,
      statusText: response.statusText 
    });
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
