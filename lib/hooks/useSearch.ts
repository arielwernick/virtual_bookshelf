import { useState } from 'react';
import { ItemType } from '@/lib/types/shelf';

export interface SearchResult {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  externalUrl: string;
  type: 'book' | 'music' | 'podcast';
}

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (itemType: ItemType) => {
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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    handleSearch,
  };
}
