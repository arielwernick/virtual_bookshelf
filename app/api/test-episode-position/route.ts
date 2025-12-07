import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const episodeId = '0hqUYWipwTCFFyxvkyXN2r';
    
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Spotify token');
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Get episode details
    const episodeResponse = await fetch(
      `https://api.spotify.com/v1/episodes/${episodeId}?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!episodeResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Episode not found: ${episodeResponse.status}`,
      });
    }

    const episode = await episodeResponse.json();
    const showId = episode.show.id;
    const showName = episode.show.name;
    const episodeName = episode.name;
    const releaseDate = episode.release_date;

    // Now let's see how many episodes this show has and where this episode falls
    const showResponse = await fetch(
      `https://api.spotify.com/v1/shows/${showId}?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const showData = await showResponse.json();
    const totalEpisodes = showData.total_episodes;

    // Try to find this episode in the first 500 episodes
    let found = false;
    let episodePosition = -1;
    let checkedEpisodes = 0;
    let offset = 0;
    
    while (!found && checkedEpisodes < Math.min(1000, totalEpisodes)) {
      const episodesResponse = await fetch(
        `https://api.spotify.com/v1/shows/${showId}/episodes?market=US&limit=50&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!episodesResponse.ok) break;

      const episodesData = await episodesResponse.json();
      const episodes = episodesData.items || [];

      for (let i = 0; i < episodes.length; i++) {
        checkedEpisodes++;
        if (episodes[i].id === episodeId) {
          found = true;
          episodePosition = checkedEpisodes;
          break;
        }
      }

      if (episodes.length < 50) break; // No more episodes
      offset += 50;
    }

    return NextResponse.json({
      success: true,
      data: {
        episodeId,
        episodeName,
        showId,
        showName,
        releaseDate,
        totalEpisodesInShow: totalEpisodes,
        found,
        episodePosition: found ? episodePosition : null,
        checkedEpisodes,
        message: found 
          ? `Found episode at position ${episodePosition} out of ${totalEpisodes} total episodes`
          : `Episode not found in first ${checkedEpisodes} episodes (out of ${totalEpisodes} total)`
      },
    });
  } catch (error) {
    console.error('Episode lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to lookup episode' },
      { status: 500 }
    );
  }
}