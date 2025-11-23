'use client';

import { useState } from 'react';
import { ItemType } from '@/lib/types/shelf';

interface SearchResult {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  externalUrl: string;
  type: 'book' | 'music' | 'podcast';
}

interface AddItemFormProps {
  onItemAdded: () => void;
  onClose: () => void;
}

export function AddItemForm({ onItemAdded, onClose }: AddItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Manual entry
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState({
    title: '',
    creator: '',
    image_url: '',
    external_url: '',
    notes: '',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const endpoint = itemType === 'book' 
        ? `/api/search/books?q=${encodeURIComponent(searchQuery)}`
        : `/api/search/music?q=${encodeURIComponent(searchQuery)}&type=${itemType === 'podcast' ? 'podcast' : 'music'}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromSearch = async (result: SearchResult) => {
    setAdding(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          title: result.title,
          creator: result.creator,
          image_url: result.imageUrl,
          external_url: result.externalUrl,
        }),
      });

      if (res.ok) {
        onItemAdded();
      }
    } catch (error) {
      console.error('Add error:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualData.title || !manualData.creator) {
      alert('Title and creator are required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          ...manualData,
        }),
      });

      if (res.ok) {
        onItemAdded();
      }
    } catch (error) {
      console.error('Add error:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>Add Item</h2>

      {/* Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setItemType('book')}
          className="px-4 py-2 rounded-full font-semibold transition-all"
          style={
            itemType === 'book'
              ? { backgroundColor: 'var(--primary-orange)', color: 'white' }
              : { backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)' }
          }
          onMouseEnter={(e) => {
            if (itemType !== 'book') {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
            }
          }}
          onMouseLeave={(e) => {
            if (itemType !== 'book') {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
            }
          }}
        >
          Book
        </button>
        <button
          onClick={() => setItemType('podcast')}
          className="px-4 py-2 rounded-full font-semibold transition-all"
          style={
            itemType === 'podcast'
              ? { backgroundColor: 'var(--primary-orange)', color: 'white' }
              : { backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)' }
          }
          onMouseEnter={(e) => {
            if (itemType !== 'podcast') {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
            }
          }}
          onMouseLeave={(e) => {
            if (itemType !== 'podcast') {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
            }
          }}
        >
          Podcast
        </button>
        <button
          onClick={() => setItemType('music')}
          className="px-4 py-2 rounded-full font-semibold transition-all"
          style={
            itemType === 'music'
              ? { backgroundColor: 'var(--primary-orange)', color: 'white' }
              : { backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)' }
          }
          onMouseEnter={(e) => {
            if (itemType !== 'music') {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
            }
          }}
          onMouseLeave={(e) => {
            if (itemType !== 'music') {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
            }
          }}
        >
          Music
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setManualMode(!manualMode)}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--primary-orange)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-orange-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-orange)'}
        >
          {manualMode ? '← Back to Search' : 'Or add manually →'}
        </button>
      </div>

      {!manualMode ? (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search for ${itemType}s...`}
                className="flex-1 px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: loading ? 'var(--gray-400)' : 'var(--primary-orange)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {searchResults.map((result) => (
              <div 
                key={result.id} 
                className="flex items-center gap-4 p-3 rounded-lg transition-all"
                style={{ border: '1px solid var(--border-color)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-color-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {result.imageUrl && (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate" style={{ color: 'var(--gray-900)' }}>{result.title}</h4>
                  <p className="text-sm truncate" style={{ color: 'var(--gray-600)' }}>{result.creator}</p>
                </div>
                <button
                  onClick={() => handleAddFromSearch(result)}
                  disabled={adding}
                  className="px-4 py-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: adding ? 'var(--gray-400)' : 'var(--primary-orange)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (!adding) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                  }}
                  onMouseLeave={(e) => {
                    if (!adding) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Manual Entry */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>Title *</label>
              <input
                type="text"
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                {itemType === 'book' ? 'Author' : itemType === 'podcast' ? 'Host' : 'Artist'} *
              </label>
              <input
                type="text"
                value={manualData.creator}
                onChange={(e) => setManualData({ ...manualData, creator: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>Image URL</label>
              <input
                type="url"
                value={manualData.image_url}
                onChange={(e) => setManualData({ ...manualData, image_url: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>External URL</label>
              <input
                type="url"
                value={manualData.external_url}
                onChange={(e) => setManualData({ ...manualData, external_url: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>Notes</label>
              <textarea
                value={manualData.notes}
                onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--gray-900)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                rows={3}
                placeholder="Why do you like this?"
              />
            </div>

            <button
              onClick={handleManualAdd}
              disabled={adding}
              className="w-full py-3 rounded-full font-semibold transition-all disabled:opacity-50"
              style={{ 
                backgroundColor: adding ? 'var(--gray-400)' : 'var(--primary-orange)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!adding) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
              }}
              onMouseLeave={(e) => {
                if (!adding) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              }}
            >
              {adding ? 'Adding...' : 'Add to Shelf'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
