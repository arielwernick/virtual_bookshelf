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

interface EpisodeResult {
  id: string;
  title: string;
  description: string;
  release_date: string;
  duration_ms: number;
  imageUrl: string;
  externalUrl: string;
  showName: string;
}

interface AddItemFormProps {
  shelfId: string;
  onItemAdded: () => void;
  onClose: () => void;
}

export function AddItemForm({ shelfId, onItemAdded, onClose }: AddItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Episode browsing state
  const [browsingEpisodes, setBrowsingEpisodes] = useState(false);
  const [selectedShow, setSelectedShow] = useState<SearchResult | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [episodeOffset, setEpisodeOffset] = useState(0);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(true);

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

  const handleBrowseEpisodes = async (show: SearchResult) => {
    setSelectedShow(show);
    setBrowsingEpisodes(true);
    setEpisodes([]);  // Ensure it's always an array
    setEpisodeOffset(0);
    setHasMoreEpisodes(true);
    setLoading(true);

    try {
      const res = await fetch(`/api/search/episodes?showId=${show.id}&offset=0&limit=20`);
      const data = await res.json();

      if (data.success) {
        setEpisodes(data.data.episodes || []);
        setHasMoreEpisodes(data.data.episodes && data.data.episodes.length >= 20); // Check if there might be more
      } else {
        console.error('Episodes API error:', data.error);
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Episodes fetch error:', error);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreEpisodes = async () => {
    if (!selectedShow || loading) return;

    setLoading(true);
    try {
      const newOffset = episodeOffset + 20;
      const res = await fetch(`/api/search/episodes?showId=${selectedShow.id}&offset=${newOffset}&limit=20`);
      const data = await res.json();

      if (data.success) {
        setEpisodes(prev => [...(prev || []), ...(data.data.episodes || [])]);
        setEpisodeOffset(newOffset);
        setHasMoreEpisodes(data.data.episodes && data.data.episodes.length >= 20); // Check if there might be more
      } else {
        console.error('Load more episodes API error:', data.error);
      }
    } catch (error) {
      console.error('Load more episodes fetch error:', error);
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
          shelf_id: shelfId,
          type: itemType,
          title: result.title,
          creator: result.creator,
          image_url: result.imageUrl,
          external_url: result.externalUrl,
        }),
      });

      if (res.ok) {
        onItemAdded();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleAddEpisode = async (episode: EpisodeResult) => {
    if (!selectedShow) return;

    setAdding(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelf_id: shelfId,
          type: 'podcast_episode',
          title: episode.title,
          creator: episode.showName,
          image_url: episode.imageUrl || selectedShow.imageUrl,
          external_url: episode.externalUrl,
        }),
      });

      if (res.ok) {
        onItemAdded();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add episode');
      }
    } catch (error) {
      console.error('Add episode error:', error);
      alert('Failed to add episode');
    } finally {
      setAdding(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m`;
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
          shelf_id: shelfId,
          type: itemType,
          ...manualData,
        }),
      });

      if (res.ok) {
        onItemAdded();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Add Item</h2>

      {/* Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setItemType('book')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            itemType === 'book'
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Book
        </button>
        <button
          onClick={() => setItemType('podcast')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            itemType === 'podcast'
              ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Podcast
        </button>
        <button
          onClick={() => setItemType('music')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            itemType === 'music'
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Music
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setManualMode(!manualMode)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {manualMode ? '← Back to Search' : 'Or add manually →'}
        </button>
        
        {browsingEpisodes && selectedShow && (
          <button
            onClick={() => {
              setBrowsingEpisodes(false);
              setSelectedShow(null);
              setEpisodes([]);
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Back to Search Results
          </button>
        )}
      </div>

      {!manualMode ? (
        <>
          {/* Search */}
          {!browsingEpisodes && (
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search for ${itemType}s...`}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {browsingEpisodes && selectedShow ? (
            /* Episode Browser */
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Episodes from "{selectedShow.title}"
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select an episode to add to your shelf
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Loading episodes...</p>
                  </div>
                ) : episodes && episodes.length > 0 ? (
                  episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-start gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                    {episode.imageUrl && (
                      <img
                        src={episode.imageUrl}
                        alt={episode.title}
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {episode.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDuration(episode.duration_ms)} • {new Date(episode.release_date).toLocaleDateString()}
                      </p>
                      {episode.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {episode.description.replace(/<[^>]*>/g, '').slice(0, 120)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddEpisode(episode)}
                      disabled={adding}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 flex-shrink-0"
                    >
                      Add Episode
                    </button>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No episodes found for this podcast.</p>
                  </div>
                )}
                
                {!loading && episodes && episodes.length > 0 && hasMoreEpisodes && (
                  <button
                    onClick={loadMoreEpisodes}
                    disabled={loading}
                    className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Episodes'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Regular Search Results */
            <div className="max-h-96 overflow-y-auto space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{result.creator}</p>
                  </div>
                  <div className="flex gap-2">
                    {result.type === 'podcast' && (
                      <button
                        onClick={() => handleBrowseEpisodes(result)}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        Browse Episodes →
                      </button>
                    )}
                    <button
                      onClick={() => handleAddFromSearch(result)}
                      disabled={adding}
                      className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Manual Entry */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                type="text"
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {itemType === 'book' ? 'Author' : itemType === 'podcast' ? 'Host' : 'Artist'} *
              </label>
              <input
                type="text"
                value={manualData.creator}
                onChange={(e) => setManualData({ ...manualData, creator: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
              <input
                type="url"
                value={manualData.image_url}
                onChange={(e) => setManualData({ ...manualData, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External URL</label>
              <input
                type="url"
                value={manualData.external_url}
                onChange={(e) => setManualData({ ...manualData, external_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={manualData.notes}
                onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Why do you like this?"
              />
            </div>

            <button
              onClick={handleManualAdd}
              disabled={adding}
              className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add to Shelf'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
