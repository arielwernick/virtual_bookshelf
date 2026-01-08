'use client';

import { EpisodeResult, ShowInfo } from '@/lib/hooks/useEpisodes';

interface EpisodeBrowserProps {
  selectedShow: ShowInfo;
  episodes: EpisodeResult[];
  searchedEpisodes: EpisodeResult[];
  searchingInShow: boolean;
  setSearchingInShow: (searching: boolean) => void;
  episodeSearchQuery: string;
  setEpisodeSearchQuery: (query: string) => void;
  hasMoreEpisodes: boolean;
  hasMoreSearchResults: boolean;
  loading: boolean;
  onSearch: () => void;
  onLoadMoreEpisodes: () => void;
  onLoadMoreSearchResults: () => void;
  onAddEpisode: (episode: EpisodeResult) => void;
  adding: boolean;
}

export function EpisodeBrowser({
  selectedShow,
  episodes,
  searchedEpisodes,
  searchingInShow,
  setSearchingInShow,
  episodeSearchQuery,
  setEpisodeSearchQuery,
  hasMoreEpisodes,
  hasMoreSearchResults,
  loading,
  onSearch,
  onLoadMoreEpisodes,
  onLoadMoreSearchResults,
  onAddEpisode,
  adding,
}: EpisodeBrowserProps) {
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m`;
  };

  const toggleBrowseMode = () => {
    setSearchingInShow(false);
    setEpisodeSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Episodes from &ldquo;{selectedShow.title}&rdquo;
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Browse recent episodes or search through all episodes
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={toggleBrowseMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !searchingInShow
                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Browse Recent
          </button>
          <button
            onClick={() => setSearchingInShow(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchingInShow
                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Search All Episodes
          </button>
        </div>
        
        {searchingInShow && (
          <div className="flex gap-2">
            <input
              type="text"
              value={episodeSearchQuery}
              onChange={(e) => setEpisodeSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Search episodes by name or description..."
              className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={onSearch}
              disabled={loading || !episodeSearchQuery.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchingInShow ? 'Searching episodes...' : 'Loading episodes...'}
            </p>
          </div>
        ) : searchingInShow ? (
          searchedEpisodes && searchedEpisodes.length > 0 ? (
            searchedEpisodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                onAdd={onAddEpisode}
                adding={adding}
                formatDuration={formatDuration}
              />
            ))
          ) : episodeSearchQuery && !loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No episodes found for &ldquo;{episodeSearchQuery}&rdquo;.</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Enter a search term to find episodes.</p>
            </div>
          )
        ) : (
          episodes && episodes.length > 0 ? (
            episodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                onAdd={onAddEpisode}
                adding={adding}
                formatDuration={formatDuration}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No episodes found for this podcast.</p>
            </div>
          )
        )}
        
        {!loading && (
          searchingInShow ? (
            searchedEpisodes && searchedEpisodes.length > 0 && hasMoreSearchResults && (
              <button
                onClick={onLoadMoreSearchResults}
                disabled={loading}
                className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Search Results'}
              </button>
            )
          ) : (
            episodes && episodes.length > 0 && hasMoreEpisodes && (
              <button
                onClick={onLoadMoreEpisodes}
                disabled={loading}
                className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Episodes'}
              </button>
            )
          )
        )}
      </div>
    </div>
  );
}

interface EpisodeCardProps {
  episode: EpisodeResult;
  onAdd: (episode: EpisodeResult) => void;
  adding: boolean;
  formatDuration: (ms: number) => string;
}

function EpisodeCard({ episode, onAdd, adding, formatDuration }: EpisodeCardProps) {
  return (
    <div className="flex items-start gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {episode.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
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
        onClick={() => onAdd(episode)}
        disabled={adding}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 flex-shrink-0"
      >
        Add Episode
      </button>
    </div>
  );
}
