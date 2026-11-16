'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportPreviewList } from './ImportPreviewList';
import { PreviewItem, getPreviewTitle } from './ParsedItemPreview';
import { ImportShelfPreview } from './ImportShelfPreview';
import { ImportItemEditor } from './ImportItemEditor';
import { ParsedItem } from '@/lib/utils/textParser';
import { saveImportDraft, loadImportDraft, clearImportDraft } from '@/lib/utils/importDraft';

type ImportState = 'input' | 'processing' | 'preview' | 'creating';

/** A short list a visitor can load to see the flow without hunting for text to paste. */
export const EXAMPLE_LIST = `Atomic Habits
The clearest book on why small changes stick.
https://www.goodreads.com/book/show/40121378-atomic-habits

Steve Jobs at Stanford
Fifteen minutes I rewatch every year.
https://www.youtube.com/watch?v=UF8uR6Z6KLc

How to Do Great Work
Long, and worth it.
https://paulgraham.com/greatwork.html`;

const importCelebrationStyles = `
@keyframes import-celebration-card-in {
    0% { opacity: 0; transform: translateY(8px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes import-celebration-circle-draw {
    to { stroke-dashoffset: 0; }
}
@keyframes import-celebration-tick-draw {
    to { stroke-dashoffset: 0; }
}
@keyframes import-celebration-fade-up {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
}
.import-celebration-card {
    animation: import-celebration-card-in 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.import-celebration-check-circle {
    stroke-dasharray: 251;
    stroke-dashoffset: 251;
    animation: import-celebration-circle-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
}
.import-celebration-check-tick {
    stroke-dasharray: 80;
    stroke-dashoffset: 80;
    animation: import-celebration-tick-draw 0.34s cubic-bezier(0.65, 0, 0.45, 1) 0.55s forwards;
}
.import-celebration-headline {
    opacity: 0;
    animation: import-celebration-fade-up 0.4s ease-out 0.75s forwards;
}
.import-celebration-subtext {
    opacity: 0;
    animation: import-celebration-fade-up 0.4s ease-out 0.9s forwards;
}
@media (prefers-reduced-motion: reduce) {
    .import-celebration-card,
    .import-celebration-check-circle,
    .import-celebration-check-tick,
    .import-celebration-headline,
    .import-celebration-subtext {
        animation: none;
        opacity: 1;
        stroke-dashoffset: 0;
    }
}
`;

interface ImportFlowProps {
  /**
   * 'page' is the full /import page: it restores a saved preview and finishes
   * a save the visitor asked for before signing up.
   * 'embedded' is the same flow inside another page (the homepage section):
   * it never restores or saves on load, and hands off to /import for sign-up.
   */
  variant?: 'page' | 'embedded';
}

export function ImportFlow({ variant = 'page' }: ImportFlowProps) {
  const restoreOnLoad = variant === 'page';
  const router = useRouter();
  const [text, setText] = useState('');
  const [state, setState] = useState<ImportState>('input');
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [shelfTitle, setShelfTitle] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });
  const [createdShelfId, setCreatedShelfId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // null while the sign-in check is in flight
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const createShelf = useCallback(async (shelfItems: PreviewItem[], title: string) => {
    setState('creating');
    setError('');

    try {
      const selectedItems = shelfItems.filter((item) => item.selected);

      const res = await fetch('/api/import/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          items: selectedItems.map((item) => ({
            url: item.resolvedUrl || item.url,
            title: getPreviewTitle(item),
            creator: item.fetchedPublisher,
            imageUrl: item.fetchedImage,
            notes: item.parsedDescription,
          })),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        if (res.status === 401) {
          // The session ended; show the sign-up step instead of a dead end
          setIsLoggedIn(false);
          setError('Sign in to save this shelf. Your preview is kept on this device.');
        } else {
          setError(json.error || 'Failed to create shelf');
        }
        setState('preview');
        return;
      }

      clearImportDraft();
      setCreatedShelfId(json.data.shelf.id);

      setTimeout(() => {
        router.push(`/shelf/${json.data.shelf.id}/edit`);
      }, 2200);
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create shelf. Please try again.');
      setState('preview');
    }
  }, [router]);

  // The restore below must run once per visit, so it reads the latest
  // createShelf through a ref instead of depending on it.
  const createShelfRef = useRef(createShelf);
  useEffect(() => {
    createShelfRef.current = createShelf;
  }, [createShelf]);

  // Check sign-in, then bring back a preview saved before a trip through
  // sign-up or sign-in. If the visitor asked to save it and is now signed in,
  // finish the save for them.
  useEffect(() => {
    let cancelled = false;

    const start = (authenticated: boolean) => {
      if (cancelled) return;
      setIsLoggedIn(authenticated);

      if (!restoreOnLoad) return;
      const draft = loadImportDraft();
      if (!draft) return;

      setItems(draft.items);
      setShelfTitle(draft.shelfTitle);
      setState('preview');

      const canSave =
        draft.shelfTitle.trim().length > 0 && draft.items.some((item) => item.selected);
      if (authenticated && draft.saveAfterAuth && canSave) {
        // Drop the flag first so a reload mid-request can't create the shelf twice
        saveImportDraft({ items: draft.items, shelfTitle: draft.shelfTitle, saveAfterAuth: false });
        createShelfRef.current(draft.items, draft.shelfTitle);
      }
    };

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => start(data.authenticated === true))
      .catch(() => start(false));

    return () => { cancelled = true; };
  }, [restoreOnLoad]);

  // Keep the preview in this browser while it is on screen
  useEffect(() => {
    if (state !== 'preview' || items.length === 0) return;
    saveImportDraft({ items, shelfTitle, saveAfterAuth: false });
  }, [state, items, shelfTitle]);

  const handleExtract = async () => {
    if (!text.trim()) {
      setError('Paste some text with links first.');
      return;
    }

    setError('');
    setState('processing');
    setProgress({ current: 0, total: 0, step: 'Parsing text...' });

    try {
      // Step 1: Parse text to extract URLs and context
      const parseRes = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const parseJson = await parseRes.json();
      if (!parseJson.success) {
        setError(parseJson.error || 'Failed to parse text');
        setState('input');
        return;
      }

      const parsedItems: ParsedItem[] = parseJson.data.items;
      if (parsedItems.length === 0) {
        setError("We couldn't find any links in that text. Each item needs a link (https://…).");
        setState('input');
        return;
      }

      // Initialize preview items
      let previewItems: PreviewItem[] = parsedItems.map((item) => ({
        url: item.url,
        parsedTitle: item.parsedTitle,
        parsedDescription: item.parsedDescription,
        selected: true,
        loading: true,
      }));

      setItems(previewItems);
      setProgress({ current: 0, total: previewItems.length, step: 'Resolving URLs...' });

      // Step 2: Resolve shortened URLs
      const urls = parsedItems.map((item) => item.url);
      const resolveRes = await fetch('/api/import/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const resolveJson = await resolveRes.json();
      if (resolveJson.success) {
        previewItems = previewItems.map((item) => ({
          ...item,
          resolvedUrl: resolveJson.data.resolved[item.url] || item.url,
        }));
        setItems([...previewItems]);
      }

      setProgress({ current: 0, total: previewItems.length, step: 'Fetching metadata...' });

      // Step 3: Fetch metadata in batches
      const resolvedUrls = previewItems.map((item) => item.resolvedUrl || item.url);
      const batchSize = 10;

      for (let i = 0; i < resolvedUrls.length; i += batchSize) {
        const batch = resolvedUrls.slice(i, i + batchSize);
        
        try {
          const metadataRes = await fetch('/api/import/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: batch }),
          });

          const metadataJson = await metadataRes.json();
          if (metadataJson.success) {
            const results = metadataJson.data.results;
            
            previewItems = previewItems.map((item) => {
              const itemUrl = item.resolvedUrl || item.url;
              const result = results.find((r: { url: string }) => r.url === itemUrl);
              
              if (result?.metadata) {
                return {
                  ...item,
                  fetchedTitle: result.metadata.title,
                  fetchedImage: result.metadata.image,
                  fetchedPublisher: result.metadata.publisher,
                  loading: false,
                };
              } else if (result?.error) {
                return {
                  ...item,
                  loading: false,
                  error: result.error === 'Quota exceeded' ? 'Preview unavailable' : undefined,
                };
              }
              return { ...item, loading: false };
            });

            setItems([...previewItems]);
          }
        } catch {
          // Mark batch items as done even on error
          previewItems = previewItems.map((item, idx) => {
            if (idx >= i && idx < i + batchSize) {
              return { ...item, loading: false };
            }
            return item;
          });
          setItems([...previewItems]);
        }

        setProgress({ 
          current: Math.min(i + batchSize, resolvedUrls.length), 
          total: resolvedUrls.length,
          step: 'Fetching metadata...'
        });
      }

      setState('preview');
    } catch (err) {
      console.error('Extract error:', err);
      setError('Failed to process text. Please try again.');
      setState('input');
    }
  };

  const handleToggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSaveItemEdit = ({ title, note }: { title: string; note: string }) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === editingIndex
          ? { ...item, customTitle: title || undefined, parsedDescription: note || undefined }
          : item
      )
    );
    setEditingIndex(null);
  };

  const handleCreateShelf = () => createShelf(items, shelfTitle);

  const handleSaveAfterAuth = (destination: 'signup' | 'login') => {
    const saved = saveImportDraft({ items, shelfTitle, saveAfterAuth: true });
    if (!saved) {
      setError(
        "This browser is blocking site storage, so the preview can't be kept through sign-up. Create your account first, then paste the list again."
      );
      return;
    }
    router.push(`/${destination}?returnTo=${encodeURIComponent('/import')}`);
  };

  const handleReset = () => {
    setText('');
    setItems([]);
    setShelfTitle('');
    setError('');
    setState('input');
    setProgress({ current: 0, total: 0, step: '' });
    setEditingIndex(null);
    clearImportDraft();
  };

  if (createdShelfId) {
    return (
      <>
        <style>{importCelebrationStyles}</style>
        <div className="import-celebration-card flex flex-col items-center text-center py-14 px-6">
          <svg viewBox="0 0 96 96" className="w-20 h-20 mb-5" aria-hidden="true">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              className="import-celebration-check-circle"
            />
            <path
              d="M28 50 L42 64 L70 32"
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="import-celebration-check-tick"
            />
          </svg>
          <h2 className="import-celebration-headline text-2xl font-bold text-gray-900 dark:text-white">
            Shelf created
          </h2>
          <p className="import-celebration-subtext mt-2 text-gray-600 dark:text-gray-400">
            Taking you to your new shelf…
          </p>
        </div>
      </>
    );
  }

  const embedded = variant === 'embedded';

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      {/* Paste step */}
      {state === 'input' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="import-text" className="sr-only">
              Paste text with links
            </label>
            <textarea
              id="import-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={embedded ? 7 : 11}
              placeholder={`Paste a reading list, a newsletter, a LinkedIn post…

Atomic Habits
The clearest book on why small changes stick.
https://www.goodreads.com/book/show/40121378-atomic-habits`}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700
                         bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent
                         text-sm leading-relaxed resize-y min-h-[140px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleExtract}
              disabled={!text.trim()}
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white dark:text-gray-900
                         bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md hover:shadow-lg
                         disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed
                         transition-all"
            >
              Preview my shelf
            </button>
            <button
              type="button"
              onClick={() => {
                setText(EXAMPLE_LIST);
                setError('');
              }}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
            >
              Try an example
            </button>
            <p className="sm:ml-auto text-xs text-gray-500 dark:text-gray-400 text-center sm:text-right">
              Each link becomes an item. Nothing is saved yet.
            </p>
          </div>
        </div>
      )}

      {/* Building step: the shelf fills in as covers arrive */}
      {state === 'processing' && (
        <div className="space-y-5" aria-busy="true">
          <div className="flex items-center gap-3" role="status">
            <div className="animate-spin h-4 w-4 border-2 border-gray-900 dark:border-gray-100 border-t-transparent dark:border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {items.length === 0
                ? 'Reading your list…'
                : progress.total > 0 && progress.step.startsWith('Fetching')
                  ? `Finding covers… ${progress.current} of ${progress.total}`
                  : 'Building your shelf…'}
            </p>
          </div>
          {items.length > 0 && (
            <ImportShelfPreview items={items} onRemove={handleToggleItem} onEdit={() => {}} busy />
          )}
        </div>
      )}

      {/* Preview step */}
      {state === 'preview' && items.length > 0 && (
        <>
          <ImportPreviewList
            items={items}
            shelfTitle={shelfTitle}
            onShelfTitleChange={setShelfTitle}
            onToggleItem={handleToggleItem}
            onEditItem={setEditingIndex}
            onCreateShelf={handleCreateShelf}
            creating={false}
            signedOut={isLoggedIn === false}
            onSignUpToSave={() => handleSaveAfterAuth('signup')}
            onSignInToSave={() => handleSaveAfterAuth('login')}
          />

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
            >
              Start over with different text
            </button>
          </div>

          <ImportItemEditor
            item={editingIndex !== null ? items[editingIndex] ?? null : null}
            onSave={handleSaveItemEdit}
            onClose={() => setEditingIndex(null)}
          />
        </>
      )}

      {/* Saving step */}
      {state === 'creating' && (
        <div className="flex flex-col items-center py-10" role="status">
          <div className="animate-spin h-6 w-6 border-2 border-gray-900 dark:border-gray-100 border-t-transparent dark:border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Saving your shelf…</p>
        </div>
      )}
    </>
  );
}
