'use client';

import { useEffect, useRef, useState } from 'react';
import type { SpotifyEmbed } from '@/lib/utils/spotifyEmbed';

/** After this long without Spotify's player starting, say so and offer the link. */
export const SLOW_LOAD_MS = 10_000;

const SPOTIFY_ORIGIN = 'https://open.spotify.com';

interface SpotifyPlayerProps {
  embed: SpotifyEmbed;
  title: string;
  creator: string;
  imageUrl: string | null;
  externalUrl: string | null;
}

/**
 * Spotify's embed player, with a placeholder shaped like it underneath.
 *
 * Spotify's iframe fires `load` (and posts `{type: 'ready'}`) well before it
 * draws anything; the frame stays transparent for up to several seconds
 * after that. No event marks the moment it paints. So the placeholder sits
 * *under* the iframe for good, showing the cover, title and creator we
 * already have, and Spotify's opaque card covers it whenever it's drawn.
 *
 * The `ready` message only tells us Spotify's player started at all. If it
 * hasn't after SLOW_LOAD_MS (Spotify timeouts happen), we offer the link.
 *
 * Render with `key={embed.src}` so paging to another item starts fresh.
 */
export function SpotifyPlayer({ embed, title, creator, imageUrl, externalUrl }: SpotifyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const tall = embed.height > 200;
  const coverSize = tall ? 'w-24 h-24 sm:w-32 sm:h-32' : 'w-[120px] h-[120px]';

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== SPOTIFY_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if ((event.data as { type?: unknown } | null)?.type === 'ready') setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <div>
      <div className="relative w-full" style={{ height: embed.height }}>
        {/* Placeholder: visible until Spotify's card paints over it */}
        <div
          className="absolute inset-0 rounded-xl bg-gray-100 dark:bg-gray-800 p-4 overflow-hidden"
          data-testid="spotify-player-placeholder"
          aria-hidden="true"
        >
          <div className="flex items-center gap-4">
            {imageUrl && !coverFailed ? (
              // Plain img: the cover is usually cached from the card behind the window
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className={`${coverSize} flex-shrink-0 rounded-lg object-cover shadow`}
                onError={() => setCoverFailed(true)}
              />
            ) : (
              <div className={`${coverSize} flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 motion-safe:animate-pulse`} />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-gray-900 dark:text-gray-100 truncate ${tall ? 'text-xl sm:text-2xl' : 'text-base'}`}>{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{creator}</p>
              <div className="mt-3 h-2 w-32 max-w-full rounded-full bg-gray-200 dark:bg-gray-700 motion-safe:animate-pulse" />
            </div>
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 motion-safe:animate-pulse" />
          </div>
          {tall && (
            <div className="mt-5 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 motion-safe:animate-pulse">
                  <div className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 flex-1 max-w-[60%] rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="ml-auto h-3 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          )}
        </div>
        <iframe
          ref={iframeRef}
          src={embed.src}
          title={`Spotify player: ${title}`}
          height={embed.height}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="absolute inset-0 w-full h-full rounded-xl border-0"
          data-testid="spotify-embed"
        />
      </div>
      {slow && !ready && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" role="status" data-testid="spotify-slow-load">
          Spotify is taking a while to load.
          {externalUrl && (
            <>
              {' '}
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 dark:hover:text-gray-100">
                Open it on Spotify instead
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
