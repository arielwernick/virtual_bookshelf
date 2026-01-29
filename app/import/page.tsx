'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportPreviewList } from '@/components/import/ImportPreviewList';
import { PreviewItem } from '@/components/import/ParsedItemPreview';
import { ParsedItem } from '@/lib/utils/textParser';
import { Confetti } from '@/components/Confetti';

type ImportState = 'input' | 'processing' | 'preview' | 'creating';

export default function ImportPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [state, setState] = useState<ImportState>('input');
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [shelfTitle, setShelfTitle] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [createdShelfId, setCreatedShelfId] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) {
      setError('Please paste some text containing links');
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
        setError('No links found in the text');
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

  const handleSelectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleCreateShelf = async () => {
    setState('creating');
    setError('');

    try {
      const selectedItems = items.filter((item) => item.selected);
      
      const res = await fetch('/api/import/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shelfTitle,
          items: selectedItems.map((item) => ({
            url: item.resolvedUrl || item.url,
            title: item.fetchedTitle || item.parsedTitle,
            creator: item.fetchedPublisher,
            imageUrl: item.fetchedImage,
            notes: item.parsedDescription,
          })),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to create shelf');
        setState('preview');
        return;
      }

      // Success - show confetti and redirect
      setCreatedShelfId(json.data.shelf.id);
      setShowConfetti(true);

      // Redirect after a moment
      setTimeout(() => {
        router.push(`/shelf/${json.data.shelf.id}/edit`);
      }, 2000);
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create shelf. Please try again.');
      setState('preview');
    }
  };

  const handleReset = () => {
    setText('');
    setItems([]);
    setShelfTitle('');
    setError('');
    setState('input');
    setProgress({ current: 0, total: 0, step: '' });
  };

  // If just created a shelf, show success state
  if (createdShelfId && showConfetti) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Confetti />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Shelf Created!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Redirecting you to your new shelf...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              📋 Create Shelf from Text
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Paste any text with links — reading lists, recommendations, articles to save — and we&apos;ll create a shelf for you.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Input state */}
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
                  rows={12}
                  placeholder={`Paste any text with links, for example:

1 → Atomic Habits
Great book on building better habits.
Really changed how I think about daily routines.
https://www.goodreads.com/book/show/40121378

2 → The Daily
Interesting podcast about current events.
Good for staying informed.
https://open.spotify.com/show/1234`}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-amber-500 focus:border-transparent
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             font-mono text-sm resize-y min-h-[200px]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="button"
                onClick={handleExtract}
                disabled={!text.trim()}
                className="w-full py-3 rounded-lg font-medium
                           bg-amber-500 hover:bg-amber-600 text-white
                           disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                           transition-colors flex items-center justify-center gap-2"
              >
                Create Shelf
              </button>
            </div>
          )}

          {/* Processing state */}
          {state === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {progress.step}
              </p>
              {progress.total > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {progress.current} of {progress.total} items
                </p>
              )}

              {/* Show items while loading */}
              {items.length > 0 && (
                <div className="mt-6 max-h-[300px] overflow-y-auto">
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={item.url}
                        className={`p-3 rounded-lg border ${
                          item.loading
                            ? 'border-gray-200 dark:border-gray-700 animate-pulse'
                            : 'border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {index + 1}. {item.parsedTitle || item.url}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview state */}
          {state === 'preview' && items.length > 0 && (
            <>
              <ImportPreviewList
                items={items}
                shelfTitle={shelfTitle}
                onShelfTitleChange={setShelfTitle}
                onToggleItem={handleToggleItem}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onCreateShelf={handleCreateShelf}
                creating={false}
              />

              <button
                type="button"
                onClick={handleReset}
                className="mt-4 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Start over with different text
              </button>
            </>
          )}

          {/* Creating state */}
          {state === 'creating' && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Creating your shelf...
              </p>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Works great with LinkedIn posts, Twitter threads, newsletters, and any text with links.
          </p>
        </div>
      </main>
    </div>
  );
}
