// YouTube API integration for video metadata fetching

export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
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
    
    // Standard format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // Short format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    
    // Embed format: youtube.com/embed/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    // Shorts format: youtube.com/shorts/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
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
    const errorData = await response.json().catch(() => ({}));
    console.error('YouTube API error:', errorData);
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
