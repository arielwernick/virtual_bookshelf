/**
 * NoteMarker - a small speech-bubble badge on a cover, telling visitors the
 * curator wrote a note for this item. Clicking the card opens the note in the
 * item popup.
 *
 * No 'use client' directive - safe for SSR. Sits in the bottom-right corner of
 * a relatively positioned cover (the type badge has the top, and can be as
 * wide as a small card). CoverPlaceholder lifts its text clear of it.
 */

export function NoteMarker() {
  return (
    <span
      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/10 dark:ring-white/15"
      title="Has a note"
      data-testid="note-marker"
    >
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
        />
      </svg>
      <span className="sr-only">Has a note</span>
    </span>
  );
}
