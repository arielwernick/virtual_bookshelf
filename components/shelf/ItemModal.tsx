'use client';
import Image from 'next/image';
import { CoverPlaceholder } from './CoverPlaceholder';

import { Item } from '@/lib/types/shelf';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { extractVideoId } from '@/lib/api/youtube';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { getAspectRatio, getAspectRatioNumeric } from '@/lib/constants/aspectRatios';
import { getImageFitMode, isAmazonHostedImage } from '@/lib/utils/imageUtils';
import { StockDrawer } from '@/components/shelf/StockDrawer';
import { getSpotifyEmbed } from '@/lib/utils/spotifyEmbed';
import { SpotifyPlayer } from '@/components/shelf/SpotifyPlayer';
import { BookFacts, BookPreview, useBookDetails } from '@/components/shelf/BookDetails';

interface ItemModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  /** The shelf's items in display order. With onNavigate, enables previous/next. */
  items?: Item[];
  /** Called with the item to show when the visitor steps to the previous or next one. */
  onNavigate?: (item: Item) => void;
}

interface NoteSectionProps {
  notes: string;
  className?: string;
}

function NoteSection({ notes, className = 'mb-4' }: NoteSectionProps) {
  return (
    <figure className={className} data-testid="notes-section">
      <figcaption className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
        Curator&apos;s note
      </figcaption>
      <blockquote className="border-l-2 border-gray-900 dark:border-gray-100 pl-4">
        <p className="font-serif text-[12px] sm:text-[13.5px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed" data-testid="notes-content">
          {notes}
        </p>
      </blockquote>
    </figure>
  );
}

/**
 * The item `dir` steps away from `current` in `items`, wrapping at the ends.
 * With `notesOnly`, items without a note are skipped. Returns null when there
 * is nowhere else to go.
 */
export function stepItem(items: Item[], current: Item, dir: 1 | -1, notesOnly: boolean): Item | null {
  const start = items.findIndex((i) => i.id === current.id);
  if (start === -1) return null;
  for (let n = 1; n < items.length; n++) {
    const candidate = items[(start + dir * n + items.length * n) % items.length];
    if (!notesOnly || candidate.notes?.trim()) return candidate;
  }
  return null;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function ItemModal({ item, isOpen, onClose, items, onNavigate }: ItemModalProps) {
  // Track whether we pushed a history entry so we know whether to pop it on close
  const pushedHistoryEntry = useRef(false);
  // Stable ref so effects don't re-run when the parent passes a new inline arrow function
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Previous / next through the shelf, optionally skipping items without a note
  const [notesOnly, setNotesOnly] = useState(false);
  const canNavigate = Boolean(onNavigate && items && items.length > 1);
  const noteCount = items ? items.filter((i) => i.notes?.trim()).length : 0;
  // Offer "Notes only" when it would actually skip something
  const showNotesOnly = canNavigate && noteCount > 0 && noteCount < (items?.length ?? 0);
  const effectiveNotesOnly = showNotesOnly && notesOnly;

  const go = (dir: 1 | -1) => {
    if (!canNavigate || !item || !items || !onNavigate) return;
    const next = stepItem(items, item, dir, effectiveNotesOnly);
    if (next) onNavigate(next);
  };
  const goRef = useRef(go);
  useLayoutEffect(() => {
    goRef.current = go;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goRef.current(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goRef.current(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Push a history entry when the modal opens so the back button closes it
  useEffect(() => {
    if (isOpen) {
      history.pushState({ itemModal: true }, '');
      pushedHistoryEntry.current = true;

      const handlePopState = () => {
        pushedHistoryEntry.current = false;
        onCloseRef.current();
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // If the modal is closing without the back button (e.g. backdrop click,
        // Escape key), pop the history entry we pushed so the URL stays clean
        if (pushedHistoryEntry.current) {
          pushedHistoryEntry.current = false;
          history.back();
        }
      };
    }
  }, [isOpen]);

  // Image fit handling state
  const [imageError, setImageError] = useState(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Stepping to another item starts it fresh: its own image, scrolled to the top
  const [shownItemId, setShownItemId] = useState(item?.id);
  if (item?.id !== shownItemId) {
    setShownItemId(item?.id);
    setImageError(false);
    setFitMode('cover');
  }
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo?.({ top: 0 });
  }, [item?.id]);

  // Book details (blurb, year, pages, preview) load when a book opens
  const book = useBookDetails(isOpen ? item : null);
  // Which item's Google preview is open; paging to another item closes it
  const [previewFor, setPreviewFor] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Check if this is a video item and extract video ID for embedding
  const isVideo = item.type === 'video';
  const videoId = isVideo && item.external_url ? extractVideoId(item.external_url) : null;
  const isStock = item.type === 'stock';
  const spotifyEmbed = isStock || videoId ? null : getSpotifyEmbed(item);
  const previewVolumeId = book.status === 'done' ? book.details.previewVolumeId : undefined;

  const navList = items && effectiveNotesOnly ? items.filter((i) => i.notes?.trim()) : items;
  const position = navList ? navList.findIndex((i) => i.id === item.id) : -1;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title, close, and previous / next through the shelf */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 id="item-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
              {item.title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {canNavigate && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => go(-1)}
                className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={effectiveNotesOnly ? 'Previous note' : 'Previous item'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => go(1)}
                className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={effectiveNotesOnly ? 'Next note' : 'Next item'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {navList && position >= 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums" data-testid="item-position">
                  {position + 1} of {navList.length}{effectiveNotesOnly ? ' notes' : ''}
                </span>
              )}
              {showNotesOnly && (
                <button
                  onClick={() => setNotesOnly((v) => !v)}
                  aria-pressed={effectiveNotesOnly}
                  className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    effectiveNotesOnly
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Notes only
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {isStock ? (
            /* Stock Layout - price strip, chart, news */
            <div className="space-y-2">
              {/* Header: logo + name + ticker */}
              <div className="flex items-center gap-4 pb-2">
                <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                  <Image
                    src={`https://financialmodelingprep.com/image-stock/${item.creator}.png`}
                    alt={item.title}
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                    style={{ padding: '8%' }}
                    unoptimized
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 mb-1">
                    stock
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-base text-gray-500 dark:text-gray-400">{item.creator}</p>
                </div>
              </div>
              {item.notes && <NoteSection notes={item.notes} />}
              <StockDrawer item={item} />
            </div>
          ) : isVideo && videoId ? (
            /* Video Layout - Full width with embedded player */
            <div className="space-y-4">
              {/* Embedded YouTube Player */}
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Video Details Below Player */}
              <div>
                <div className="mb-3">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                    video
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {item.title}
                </h3>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">
                  by {item.creator}
                </p>

                {/* The curator's note comes first: it's why the item is here */}
                {item.notes && <NoteSection notes={item.notes} />}

                {/* Rating display */}
                {item.rating && (
                  <div className="mb-4">
                    <StarDisplay rating={item.rating} size="md" />
                  </div>
                )}

                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <span>Watch on YouTube</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ) : spotifyEmbed ? (
            /* Spotify Layout - the player already shows cover, title and creator,
               so only what Spotify doesn't know goes below it */
            <div className="space-y-4" data-testid="spotify-layout">
              <SpotifyPlayer
                key={spotifyEmbed.src}
                embed={spotifyEmbed}
                title={item.title}
                creator={item.creator}
                imageUrl={item.image_url}
                externalUrl={item.external_url}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                    item.type === 'podcast' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200' :
                    item.type === 'podcast_episode' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' :
                    'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                  }`}>
                    {item.type === 'podcast_episode' ? 'episode' : item.type}
                  </span>
                  {item.rating && <StarDisplay rating={item.rating} size="md" />}
                </div>
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <span>Open in Spotify</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {item.notes && <NoteSection notes={item.notes} className="" />}
            </div>
          ) : (
            /* Standard Layout - Side by side for non-video items */
            <div>
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {/* Cover Image */}
              <div className="w-32 sm:w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
                {(() => {
                  const baseRatioStr = getAspectRatio(item.type);
                  const baseRatioNum = getAspectRatioNumeric(item.type);
                  const containerStyle = { aspectRatio: baseRatioNum || baseRatioStr } as React.CSSProperties;
                  return (
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden shadow-lg" style={containerStyle}>
                      {item.image_url && !imageError ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} object-center`}
                          sizes="(max-width: 640px) 128px, (max-width: 768px) 192px, 256px"
                          onLoad={(e) => {
                            try {
                              const containerRatio = baseRatioNum;
                              const isAmazon = isAmazonHostedImage(item.image_url || '');
                              if (isAmazon) {
                                setFitMode('contain');
                                return;
                              }
                              setFitMode(getImageFitMode(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, containerRatio));
                            } catch {
                              setFitMode('cover');
                            }
                          }}
                          onError={() => setImageError(true)}
                          unoptimized
                        />
                      ) : (
                        <CoverPlaceholder item={item} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Item Details */}
              <div className="flex-1">
                <div className="mb-3 sm:mb-4">
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                    item.type === 'book' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' :
                    item.type === 'podcast' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200' :
                    item.type === 'music' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' :
                    item.type === 'podcast_episode' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' :
                    'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {item.title}
                </h3>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  by {item.creator}
                </p>

                {/* The curator's note comes first: it's why the item is here */}
                {item.notes && <NoteSection notes={item.notes} className="mb-4 sm:mb-6" />}

                {/* Rating display */}
                {item.rating && (
                  <div className="mb-4 sm:mb-6">
                    <StarDisplay rating={item.rating} size="md" />
                  </div>
                )}

                <BookFacts key={item.id} state={book} />

                <div className="flex flex-wrap items-center gap-2">
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    <span>View on {
                      item.external_url.includes('spotify') ? 'Spotify' :
                      item.external_url.includes('google') ? 'Google Books' :
                      'External Site'
                    }</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {previewVolumeId && previewFor !== item.id && (
                  <button
                    type="button"
                    onClick={() => setPreviewFor(item.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Preview the book</span>
                  </button>
                )}
                </div>
              </div>
            </div>
            {previewVolumeId && previewFor === item.id && <BookPreview volumeId={previewVolumeId} title={item.title} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
