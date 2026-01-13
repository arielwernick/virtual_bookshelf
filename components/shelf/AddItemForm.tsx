'use client';

import { useState } from 'react';
import { ItemType } from '@/lib/types/shelf';
import { useSearch, SearchResult } from '@/lib/hooks/useSearch';
import { useEpisodes, EpisodeResult } from '@/lib/hooks/useEpisodes';
import { useManualEntry } from '@/lib/hooks/useManualEntry';
import { SearchForm } from './forms/SearchForm';
import { EpisodeBrowser } from './forms/EpisodeBrowser';
import { ManualEntryForm } from './forms/ManualEntryForm';
import { VideoUrlForm } from './forms/VideoUrlForm';
import { LinkUrlForm } from './forms/LinkUrlForm';

interface AddItemFormProps {
  shelfId: string;
  onItemAdded: () => void;
  onClose: () => void;
}

export function AddItemForm({ shelfId, onItemAdded }: Omit<AddItemFormProps, 'onClose'>) {
  const [itemType, setItemType] = useState<ItemType>('book');
  const [adding, setAdding] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [fetchingLink, setFetchingLink] = useState(false);
  const [linkQuotaExceeded, setLinkQuotaExceeded] = useState(false);

  const search = useSearch();
  const episodes = useEpisodes();
  const manual = useManualEntry();

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
          image_url: episode.imageUrl || episodes.selectedShow?.imageUrl,
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

  const handleFetchVideo = async () => {
    if (!videoUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    setFetchingVideo(true);

    try {
      const res = await fetch('/api/items/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          shelf_id: shelfId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onItemAdded();
        setVideoUrl('');
      } else {
        alert(data.error || 'Failed to fetch video details');
      }
    } catch (error) {
      console.error('Fetch video error:', error);
      alert('Failed to fetch video details');
    } finally {
      setFetchingVideo(false);
    }
  };

  const handleFetchLink = async () => {
    if (!linkUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    setFetchingLink(true);

    try {
      const res = await fetch('/api/items/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkUrl,
          shelf_id: shelfId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onItemAdded();
        setLinkUrl('');
        // Reset quota state on successful request
        setLinkQuotaExceeded(false);
      } else {
        // Check if quota is exceeded (503 status)
        if (res.status === 503 && data.error === 'quota_exceeded') {
          setLinkQuotaExceeded(true);
          // Don't show alert, just disable the feature
        } else {
          alert(data.error || 'Failed to fetch link metadata');
        }
      }
    } catch (error) {
      console.error('Fetch link error:', error);
      alert('Failed to fetch link metadata');
    } finally {
      setFetchingLink(false);
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

        <button
          onClick={() => setItemType('video')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            itemType === 'video'
              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Video
        </button>

        <button
          onClick={() => setItemType('link')}
          disabled={linkQuotaExceeded}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            linkQuotaExceeded
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
              : itemType === 'link'
              ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={linkQuotaExceeded ? 'Link preview service temporarily unavailable' : ''}
        >
          Link
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => manual.setManualMode(!manual.manualMode)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {manual.manualMode ? '← Back to Search' : 'Or add manually →'}
        </button>
        
        {episodes.browsingEpisodes && episodes.selectedShow ? (
          <button
            onClick={episodes.resetEpisodeBrowsing}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Back to Search Results
          </button>
        ) : null}
      </div>

      {!manual.manualMode ? (
        <>
          {!episodes.browsingEpisodes && (
            <div className="mb-6">
              {itemType === 'video' ? (
                <VideoUrlForm
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  onSubmit={handleFetchVideo}
                  fetching={fetchingVideo}
                />
              ) : itemType === 'link' ? (
                <LinkUrlForm
                  linkUrl={linkUrl}
                  setLinkUrl={setLinkUrl}
                  onSubmit={handleFetchLink}
                  fetching={fetchingLink}
                  quotaExceeded={linkQuotaExceeded}
                />
              ) : (
                <SearchForm
                  itemType={itemType}
                  searchQuery={search.searchQuery}
                  setSearchQuery={search.setSearchQuery}
                  searchResults={search.searchResults}
                  loading={search.loading}
                  onSearch={() => search.handleSearch(itemType)}
                  onAddResult={handleAddFromSearch}
                  onBrowseEpisodes={(result) => episodes.handleBrowseEpisodes(result)}
                  adding={adding}
                />
              )}
            </div>
          )}

          {episodes.browsingEpisodes && episodes.selectedShow ? (
            <EpisodeBrowser
              selectedShow={episodes.selectedShow}
              episodes={episodes.episodes}
              searchedEpisodes={episodes.searchedEpisodes}
              searchingInShow={episodes.searchingInShow}
              setSearchingInShow={episodes.setSearchingInShow}
              episodeSearchQuery={episodes.episodeSearchQuery}
              setEpisodeSearchQuery={episodes.setEpisodeSearchQuery}
              hasMoreEpisodes={episodes.hasMoreEpisodes}
              hasMoreSearchResults={episodes.hasMoreSearchResults}
              loading={episodes.loading}
              onSearch={episodes.handleEpisodeSearch}
              onLoadMoreEpisodes={episodes.loadMoreEpisodes}
              onLoadMoreSearchResults={episodes.loadMoreSearchResults}
              onAddEpisode={handleAddEpisode}
              adding={adding}
            />
          ) : null}
        </>
      ) : (
        <ManualEntryForm
          itemType={itemType}
          manualData={manual.manualData}
          setManualData={manual.setManualData}
          onSubmit={() => manual.handleManualAdd(shelfId, itemType, onItemAdded)}
          adding={manual.adding}
        />
      )}
    </div>
  );
}
