'use client';

import { useRef, useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Item } from '@/lib/types/shelf';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';

export default function TalkToBookDemoPage() {
  const { state, start, stop } = useAudioRecorder();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [textInput, setTextInput] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [shelfError, setShelfError] = useState<string | null>(null);

  // Fetch items from the "Magical Speaking Books" shelf
  useEffect(() => {
    async function fetchShelf() {
      try {
        setShelfLoading(true);
        const res = await fetch('/api/demo/magical-books');
        
        const data = await res.json();
        console.log('API Response:', data);
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch shelf');
        }
        
        if (data.data?.items) {
          setItems(data.data.items);
        }
      } catch (error) {
        console.error('Error fetching shelf:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unable to load the magical books shelf';
        setShelfError(errorMsg);
      } finally {
        setShelfLoading(false);
      }
    }

    fetchShelf();
  }, []);

  async function sendAudio(blob: Blob) {
    setLoading('thinking');
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('history', JSON.stringify(messages));

    const res = await fetch('/api/talk-to-book', { method: 'POST', body: form });
    if (!res.ok) {
      setLoading('idle');
      return;
    }

    const transcription = decodeURIComponent(res.headers.get('X-Transcription') || '');
    const text = decodeURIComponent(res.headers.get('X-Text') || '');
    const buf = await res.arrayBuffer();

    setMessages((prev) => [...prev, { role: 'user', content: transcription }, { role: 'assistant', content: text }]);

    const audioBlob = new Blob([buf], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = url;
      setLoading('speaking');
      await audioRef.current.play();
      setLoading('idle');
    }
  }

  async function handlePress() {
    if (!state.isSupported) return;
    setLoading('listening');
    await start();
  }

  async function handleRelease() {
    const blob = await stop();
    if (blob) await sendAudio(blob);
  }

  async function sendText() {
    if (!textInput.trim()) return;
    setLoading('thinking');
    const res = await fetch('/api/talk-to-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textInput, history: messages }),
    });
    if (!res.ok) {
      setLoading('idle');
      return;
    }

    const transcription = decodeURIComponent(res.headers.get('X-Transcription') || '');
    const text = decodeURIComponent(res.headers.get('X-Text') || '');
    const buf = await res.arrayBuffer();

    setMessages((prev) => [...prev, { role: 'user', content: transcription }, { role: 'assistant', content: text }]);
    setTextInput('');

    const audioBlob = new Blob([buf], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = url;
      setLoading('speaking');
      await audioRef.current.play();
      setLoading('idle');
    }
  }

  // Render modal when item is selected
  if (selectedItem) {
    return (
      <TalkToBookModal 
        item={selectedItem}
        isOpen={true}
        onClose={() => setSelectedItem(null)}
        messages={messages}
        loading={loading}
        textInput={textInput}
        setTextInput={setTextInput}
        onSendAudio={sendAudio}
        onSendText={sendText}
        onPress={handlePress}
        onRelease={handleRelease}
        audioRef={audioRef}
      />
    );
  }

  // Shelf view
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Magical Speaking Books
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            A voice AI demo powered by Hathora Models. Click any book below to start a conversation!
          </p>
        </div>

        {shelfLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading magical books...</p>
          </div>
        ) : shelfError ? (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 text-lg">{shelfError}</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No books found in this shelf yet.</p>
          </div>
        ) : (
          <>
            <ShelfGrid 
              items={items}
              onItemClick={(item) => setSelectedItem(item)}
            />

            <div className="mt-8 max-w-2xl mx-auto text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click any book to have a voice conversation about its story, characters, and themes!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Modal component with chat interface
interface TalkToBookModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  loading: 'idle' | 'listening' | 'thinking' | 'speaking';
  textInput: string;
  setTextInput: (value: string) => void;
  onSendAudio: (blob: Blob) => void;
  onSendText: () => void;
  onPress: () => void;
  onRelease: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

function TalkToBookModal({
  item,
  isOpen,
  onClose,
  messages,
  loading,
  textInput,
  setTextInput,
  onSendText,
  onPress,
  onRelease,
  audioRef,
}: TalkToBookModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
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

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Cover Image */}
            <div className="w-32 sm:w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden shadow-lg">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="flex-1">
              <div className="mb-3 sm:mb-4">
                <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                  {item.type}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {item.title}
              </h3>

              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                by {item.creator}
              </p>

              {/* Conversation Section (replaces Notes) */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversation</span>
                </div>

                {/* Chat Messages */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 sm:p-4 mb-3 max-h-[300px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">📖</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "Hello there! Ask me about friendship, honey, or adventures in the Hundred Acre Wood!"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs shadow-sm">
                            {m.role === 'user' ? '👤' : '📖'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-0.5">
                              {m.role === 'user' ? 'You' : 'Winnie'}
                            </div>
                            <div className={`text-gray-800 dark:text-gray-200 ${m.role === 'assistant' ? 'italic' : ''}`}>
                              {m.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      {loading === 'thinking' && (
                        <div className="flex gap-2 text-sm opacity-60">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs">
                            📖
                          </div>
                          <div className="flex-1 text-gray-600 dark:text-gray-400 italic text-sm">
                            Thinking...
                          </div>
                        </div>
                      )}
                      {loading === 'speaking' && (
                        <div className="flex gap-2 text-sm opacity-60">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs">
                            🔊
                          </div>
                          <div className="flex-1 text-gray-600 dark:text-gray-400 italic text-sm">
                            Speaking...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input Controls */}
                <div className="flex flex-col gap-2">
                  <button
                    onMouseDown={onPress}
                    onMouseUp={onRelease}
                    onTouchStart={onPress}
                    onTouchEnd={onRelease}
                    disabled={loading !== 'idle'}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === 'listening' ? '🎙️ Listening...' : '🎤 Hold to ask via voice'}
                  </button>
                  <div className="flex gap-2">
                    <input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSendText()}
                      placeholder="Or type your question..."
                      disabled={loading !== 'idle'}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button 
                      onClick={onSendText} 
                      disabled={loading !== 'idle' || !textInput.trim()}
                      className="rounded-lg bg-gray-800 dark:bg-gray-700 px-4 py-2 text-white text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* External Link */}
              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <span>View on Google Books</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
