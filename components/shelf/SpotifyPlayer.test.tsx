import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SpotifyPlayer, SLOW_LOAD_MS } from './SpotifyPlayer';
import type { SpotifyEmbed } from '@/lib/utils/spotifyEmbed';

const track: SpotifyEmbed = { src: 'https://open.spotify.com/embed/track/abc?utm_source=generator', height: 152 };
const album: SpotifyEmbed = { src: 'https://open.spotify.com/embed/album/abc?utm_source=generator', height: 352 };

function renderComponent(props: Partial<Parameters<typeof SpotifyPlayer>[0]> = {}) {
  return render(
    <SpotifyPlayer
      embed={track}
      title="Blue in Green"
      creator="Miles Davis"
      imageUrl="https://example.com/cover.jpg"
      externalUrl="https://open.spotify.com/track/abc"
      {...props}
    />
  );
}

/** Spotify's player posts {type: 'ready'} to the parent once it starts. */
function postReady({
  origin = 'https://open.spotify.com',
  source = (screen.getByTestId('spotify-embed') as HTMLIFrameElement).contentWindow,
}: { origin?: string; source?: Window | null } = {}) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'ready' }, origin, source }));
  });
}

function waitPastSlowLimit() {
  act(() => {
    vi.advanceTimersByTime(SLOW_LOAD_MS);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('SpotifyPlayer', () => {
  describe('Rendering', () => {
    it('puts a placeholder with the known cover, title and creator under the player', () => {
      const { container } = renderComponent();
      const placeholder = screen.getByTestId('spotify-player-placeholder');
      expect(placeholder).toHaveTextContent('Blue in Green');
      expect(placeholder).toHaveTextContent('Miles Davis');
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/cover.jpg');
      // Iframe comes after the placeholder, so it paints on top
      expect(placeholder.nextElementSibling).toBe(screen.getByTestId('spotify-embed'));
    });

    it('sizes the player area to the embed height', () => {
      renderComponent({ embed: album });
      expect(screen.getByTestId('spotify-player-placeholder').parentElement).toHaveStyle({ height: '352px' });
    });

    it('falls back to a pulsing block when there is no cover', () => {
      const { container } = renderComponent({ imageUrl: null });
      expect(container.querySelector('img')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('offers the Spotify link when the player has not started in time', () => {
      vi.useFakeTimers();
      renderComponent();
      expect(screen.queryByTestId('spotify-slow-load')).not.toBeInTheDocument();
      waitPastSlowLimit();
      expect(screen.getByRole('link', { name: 'Open it on Spotify instead' })).toHaveAttribute(
        'href',
        'https://open.spotify.com/track/abc'
      );
    });

    it('does not show the slow message once Spotify reports ready', () => {
      vi.useFakeTimers();
      renderComponent();
      postReady();
      waitPastSlowLimit();
      expect(screen.queryByTestId('spotify-slow-load')).not.toBeInTheDocument();
    });

    it('ignores ready messages from other origins', () => {
      vi.useFakeTimers();
      renderComponent();
      postReady({ origin: 'https://evil.example' });
      waitPastSlowLimit();
      expect(screen.getByTestId('spotify-slow-load')).toBeInTheDocument();
    });

    it('ignores ready messages from other Spotify frames', () => {
      vi.useFakeTimers();
      renderComponent();
      postReady({ source: window });
      waitPastSlowLimit();
      expect(screen.getByTestId('spotify-slow-load')).toBeInTheDocument();
    });
  });
});
