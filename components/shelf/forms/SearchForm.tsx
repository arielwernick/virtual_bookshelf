'use client';

import Image from 'next/image';
import { ItemType } from '@/lib/types/shelf';
import { SearchResult } from '@/lib/hooks/useSearch';

interface SearchFormProps {
  itemType: ItemType;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  loading: boolean;
  onSearch: () => void;
  onAddResult: (result: SearchResult) => void;
  onBrowseEpisodes: (result: SearchResult) => void;
  adding: boolean;
}

export function SearchForm({
  itemType,
  searchQuery,
  setSearchQuery,
  searchResults,
  loading,
  onSearch,
  onAddResult,
  onBrowseEpisodes,
  adding,
}: SearchFormProps) {
  return (
    <>
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={`Search for ${itemType}s...`}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {searchResults && searchResults.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            {result.imageUrl && (
              <Image
                src={result.imageUrl}
                alt={result.title}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded"
                unoptimized
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{result.creator}</p>
            </div>
            <div className="flex gap-2">
              {result.type === 'podcast' && (
                <button
                  onClick={() => onBrowseEpisodes(result)}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Browse Episodes →
                </button>
              )}
              <button
                onClick={() => onAddResult(result)}
                disabled={adding}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
