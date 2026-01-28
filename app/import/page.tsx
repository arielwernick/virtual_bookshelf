'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImportPreviewList } from '@/components/import/ImportPreviewList';
import { PreviewItem } from '@/components/import/ParsedItemPreview';
import { ParsedItem } from '@/lib/utils/textParser';
import { Confetti } from '@/components/Confetti';

type ImportState = 'input' | 'parsing' | 'resolving' | 'metadata' | 'preview' | 'creating' | 'success';

// Key for localStorage
const PENDING_IMPORT_KEY = 'pending_import';

interface PendingImport {
  items: PreviewItem[];
  shelfTitle: string;
  timestamp: number;
}

// Check for pending import from localStorage (lazy initializer)
function getInitialItems(): PreviewItem[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(PENDING_IMPORT_KEY);
  if (stored) {
    try {
      const pending: PendingImport = JSON.parse(stored);
      if (Date.now() - pending.timestamp < 24 * 60 * 60 * 1000) {
        return pending.items;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function getInitialShelfTitle(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem(PENDING_IMPORT_KEY);
  if (stored) {
    try {
      const pending: PendingImport = JSON.parse(stored);
      if (Date.now() - pending.timestamp < 24 * 60 * 60 * 1000) {
        return pending.shelfTitle;
      }
    } catch {
      // ignore
    }
  }
  return '';
}

function getInitialState(): ImportState {
  if (typeof window === 'undefined') return 'input';
  
  const stored = localStorage.getItem(PENDING_IMPORT_KEY);
  if (stored) {
    try {
      const pending: PendingImport = JSON.parse(stored);
      if (Date.now() - pending.timestamp < 24 * 60 * 60 * 1000) {
        // Clear on read
        localStorage.removeItem(PENDING_IMPORT_KEY);
        return 'preview';
      }
      localStorage.removeItem(PENDING_IMPORT_KEY);
    } catch {
      localStorage.removeItem(PENDING_IMPORT_KEY);
    }
  }
  return 'input';
}

export default function ImportPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [state, setState] = useState<ImportState>(getInitialState);
  const [items, setItems] = useState<PreviewItem[]>(getInitialItems);
  const [shelfTitle, setShelfTitle] = useState(getInitialShelfTitle);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [createdShelfId, setCreatedShelfId] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/shelf/dashboard');
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Save pending import before auth redirect
  const savePendingImport = useCallback(() => {
    if (items.length > 0) {
      const pending: PendingImport = {
        items,
        shelfTitle,
        timestamp: Date.now(),
      };
      localStorage.setItem(PENDING_IMPORT_KEY, JSON.stringify(pending));
    }
  }, [items, shelfTitle]);

  const handleExtract = async () => {
    if (!text.trim()) {
      setError('Please paste some text containing links');
      return;
    }

    setError('');
    setState('parsing');

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
      setState('resolving');

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

      setState('metadata');

      // Step 3: Fetch metadata in batches
      const resolvedUrls = previewItems.map((item) => item.resolvedUrl || item.url);
      const batchSize = 10;
      setProgress({ current: 0, total: resolvedUrls.length });

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

        setProgress({ current: Math.min(i + batchSize, resolvedUrls.length), total: resolvedUrls.length });
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
    if (!isAuthenticated) {
      // Save state and redirect to signup
      savePendingImport();
      router.push('/signup?returnTo=/import');
      return;
    }

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

      // Success!
      setCreatedShelfId(json.data.shelf.id);
      setState('success');
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
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {showConfetti && <Confetti />}
      
      {/* Navigation */}
      <nav className="border-b border-amber-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-amber-600 dark:text-amber-500">
            📚 Virtual Bookshelf
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              📋 Import from Text
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Paste any text with links — social media posts, newsletters, notes — and we&apos;ll create a shelf for you.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success state */}
          {state === 'success' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Shelf Created!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Redirecting you to your new shelf...
              </p>
              {createdShelfId && (
                <Link
                  href={`/shelf/${createdShelfId}/edit`}
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  Go to shelf now
                </Link>
              )}
            </div>
          )}

          {/* Input state */}
          {(state === 'input' || state === 'parsing') && (
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
                  disabled={state === 'parsing'}
                  placeholder={`Paste any text with links, for example:

1 → THE CODE
Scale at global level.
Teaches you how to code with AI and AI Agents
https://lnkd.in/dcibJhzQ

2 → Airbnb Tech Blog
Product engineering done right.
User focused systems.
https://airbnb.tech/blog/`}
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
                disabled={state === 'parsing' || !text.trim()}
                className="w-full py-3 rounded-lg font-medium
                           bg-amber-500 hover:bg-amber-600 text-white
                           disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                           transition-colors flex items-center justify-center gap-2"
              >
                {state === 'parsing' ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Extracting links...
                  </>
                ) : (
                  'Extract Links'
                )}
              </button>
            </div>
          )}

          {/* Loading states */}
          {(state === 'resolving' || state === 'metadata') && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {state === 'resolving' && 'Resolving shortened URLs...'}
                {state === 'metadata' && (
                  <>
                    Fetching metadata... ({progress.current}/{progress.total})
                  </>
                )}
              </p>

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
                isAuthenticated={isAuthenticated}
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
