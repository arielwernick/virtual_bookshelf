import { describe, it, expect } from 'vitest';
import { spotifyLinkProblem } from './itemLinkCheck';

const ID = '7Fj0XEuUQLUqoMZQdsLXqp';

describe('spotifyLinkProblem', () => {
  it('turns away an episode that links to its show', () => {
    const problem = spotifyLinkProblem('podcast_episode', `https://open.spotify.com/show/${ID}`);
    expect(problem).toContain('show link');
    expect(problem).toContain('podcast_episode');
  });

  it('accepts an episode that links to an episode', () => {
    expect(spotifyLinkProblem('podcast_episode', `https://open.spotify.com/episode/${ID}`)).toBeNull();
  });

  it('accepts episodes with no link or a non-Spotify link', () => {
    expect(spotifyLinkProblem('podcast_episode', undefined)).toBeNull();
    expect(spotifyLinkProblem('podcast_episode', 'https://podcasts.apple.com/us/podcast/x/id1050462261?i=1000')).toBeNull();
  });

  it('leaves other types alone', () => {
    expect(spotifyLinkProblem('podcast', `https://open.spotify.com/show/${ID}`)).toBeNull();
    expect(spotifyLinkProblem('music', `https://open.spotify.com/album/${ID}`)).toBeNull();
  });
});
