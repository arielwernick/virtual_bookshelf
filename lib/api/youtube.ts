// YouTube API integration for video metadata fetching

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('YouTubeAPI');

export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  handle: string | null;
  thumbnailUrl: string;
  channelUrl: string;
}

/**
 * Extract channel identifier from various YouTube channel URL formats:
 * - youtube.com/@username
 * - youtube.com/c/ChannelName
 * - youtube.com/channel/CHANNEL_ID
 * 
 * Returns an object with the identifier and its type, or null if not a channel URL
 */
export function extractChannelIdentifier(url: string): { type: 'handle' | 'username' | 'id'; value: string } | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow YouTube domains (exact match or subdomain of youtube.com)
    const isYouTubeDomain = urlObj.hostname === 'youtube.com' || 
                           urlObj.hostname === 'www.youtube.com' ||
                           urlObj.hostname === 'm.youtube.com';
    
    if (!isYouTubeDomain) {
      return null;
    }
    
    // @username format: youtube.com/@username
    if (urlObj.pathname.startsWith('/@')) {
      const handle = urlObj.pathname.slice(2).split('/')[0]; // Remove /@ and get first path segment
      if (handle) {
        return { type: 'handle', value: handle };
      }
    }
    
    // /c/ChannelName format: youtube.com/c/ChannelName
    if (urlObj.pathname.startsWith('/c/')) {
      const username = urlObj.pathname.slice(3).split('/')[0]; // Remove /c/ and get first path segment
      if (username) {
        return { type: 'username', value: username };
      }
    }
    
    // /channel/ID format: youtube.com/channel/CHANNEL_ID
    if (urlObj.pathname.startsWith('/channel/')) {
      const channelId = urlObj.pathname.slice(9).split('/')[0]; // Remove /channel/ and get first path segment
      if (channelId) {
        return { type: 'id', value: channelId };
      }
    }
    
    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Extract video ID from various YouTube URL formats:
 * - youtube.com/watch?v=xxx
 * - youtu.be/xxx
 * - youtube.com/embed/xxx
 * - youtube.com/shorts/xxx
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow YouTube domains (exact match or subdomain of youtube.com)
    const isYouTubeDomain = urlObj.hostname === 'youtube.com' || 
                           urlObj.hostname === 'www.youtube.com' ||
                           urlObj.hostname === 'm.youtube.com';
    
    // Standard format: youtube.com/watch?v=VIDEO_ID
    if (isYouTubeDomain && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // Short format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    
    // Embed format: youtube.com/embed/VIDEO_ID
    if (isYouTubeDomain && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    // Shorts format: youtube.com/shorts/VIDEO_ID
    if (isYouTubeDomain && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Fetch video metadata from YouTube Data API v3
 * This uses the Videos.list endpoint which costs 1 quota unit
 */
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    logger.error('YouTube API error', { 
      videoId, 
      status: response.status,
      statusText: response.statusText 
    });
    throw new Error(`Failed to fetch video details: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }
  
  const video = data.items[0];
  const snippet = video.snippet;
  
  // Get the highest quality thumbnail available
  const thumbnail = 
    snippet.thumbnails.maxres?.url ||
    snippet.thumbnails.high?.url ||
    snippet.thumbnails.medium?.url ||
    snippet.thumbnails.default?.url ||
    '';
  
  return {
    id: videoId,
    title: snippet.title,
    channelName: snippet.channelTitle,
    thumbnailUrl: thumbnail,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Fetch channel metadata from YouTube Data API v3
 * This uses the Channels.list endpoint which costs 1 quota unit
 * 
 * @param identifier - Object containing the channel identifier type and value
 */
export async function getChannelDetails(identifier: { type: 'handle' | 'username' | 'id'; value: string }): Promise<YouTubeChannel> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }
  
  // Build the API URL based on identifier type
  let apiUrl: string;
  
  if (identifier.type === 'id') {
    // Query by channel ID
    apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(identifier.value)}&key=${apiKey}`;
  } else if (identifier.type === 'handle') {
    // Query by handle (@username) - requires forUsername parameter
    apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(identifier.value)}&key=${apiKey}`;
  } else {
    // Query by custom username (/c/ChannelName) - requires forUsername parameter
    apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${encodeURIComponent(identifier.value)}&key=${apiKey}`;
  }
  
  const response = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    logger.error('YouTube API error', { 
      identifier, 
      status: response.status,
      statusText: response.statusText 
    });
    throw new Error(`Failed to fetch channel details: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found or is unavailable');
  }
  
  const channel = data.items[0];
  const snippet = channel.snippet;
  
  // Get the highest quality thumbnail available
  const thumbnail = 
    snippet.thumbnails.high?.url ||
    snippet.thumbnails.medium?.url ||
    snippet.thumbnails.default?.url ||
    '';
  
  // Extract handle from customUrl if available, otherwise use @title
  const handle = snippet.customUrl || null;
  
  return {
    id: channel.id,
    title: snippet.title,
    handle: handle,
    thumbnailUrl: thumbnail,
    channelUrl: `https://www.youtube.com/channel/${channel.id}`,
  };
}
