/**
 * Small ▶ badge on the cover of items that can play in the Spotify player.
 * Purely visual: clicks fall through to the card, which opens the item window
 * where the player lives. No 'use client' so static cards can use it too.
 */
export function SpotifyPlayBadge() {
  return (
    <div
      className="pointer-events-none absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-md transition-transform group-hover:scale-110"
      data-testid="spotify-play-badge"
      aria-hidden="true"
    >
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
      </svg>
    </div>
  );
}
