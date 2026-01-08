import { useState } from 'react';

export interface EpisodeResult {
  id: string;
  title: string;
  description: string;
  release_date: string;
  duration_ms: number;
  imageUrl: string;
  externalUrl: string;
  showName: string;
}

export interface ShowInfo {
  id: string;
  title: string;
  imageUrl: string;
}

export function useEpisodes() {
  const [browsingEpisodes, setBrowsingEpisodes] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowInfo | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [episodeOffset, setEpisodeOffset] = useState(0);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(true);
  
  const [searchingInShow, setSearchingInShow] = useState(false);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');
  const [searchedEpisodes, setSearchedEpisodes] = useState<EpisodeResult[]>([]);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleBrowseEpisodes = async (show: ShowInfo) => {
    setSelectedShow(show);
    setBrowsingEpisodes(true);
    setSearchingInShow(false);
    setEpisodes([]);
    setEpisodeOffset(0);
    setHasMoreEpisodes(true);
    setEpisodeSearchQuery('');
    setSearchedEpisodes([]);
    setLoading(true);

    try {
      const res = await fetch(`/api/search/episodes?showId=${show.id}&offset=0&limit=50`);
      const data = await res.json();

      if (data.success) {
        const episodeList = data.data.episodes || [];
        setEpisodes(episodeList);
        setHasMoreEpisodes(episodeList && episodeList.length >= 50);
        setEpisodeOffset(50);
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

  const handleEpisodeSearch = async () => {
    if (!selectedShow || !episodeSearchQuery.trim()) return;

    setSearchingInShow(true);
    setLoading(true);
    setSearchedEpisodes([]);
    setSearchOffset(0);

    try {
      const res = await fetch(
        `/api/search/episodes/in-show?showId=${selectedShow.id}&q=${encodeURIComponent(episodeSearchQuery)}&offset=0&limit=20`
      );
      const data = await res.json();

      if (data.success) {
        setSearchedEpisodes(data.data.episodes || []);
        setHasMoreSearchResults(data.data.hasMore || false);
        setSearchOffset(20);
      } else {
        console.error('Episode search API error:', data.error);
        setSearchedEpisodes([]);
      }
    } catch (error) {
      console.error('Episode search fetch error:', error);
      setSearchedEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSearchResults = async () => {
    if (!selectedShow || !episodeSearchQuery.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/episodes/in-show?showId=${selectedShow.id}&q=${encodeURIComponent(episodeSearchQuery)}&offset=${searchOffset}&limit=20`
      );
      const data = await res.json();

      if (data.success) {
        setSearchedEpisodes(prev => [...(prev || []), ...(data.data.episodes || [])]);
        setHasMoreSearchResults(data.data.hasMore || false);
        setSearchOffset(searchOffset + 20);
      } else {
        console.error('Load more search results API error:', data.error);
      }
    } catch (error) {
      console.error('Load more search results fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreEpisodes = async () => {
    if (!selectedShow || loading) return;

    setLoading(true);
    try {
      const newOffset = episodeOffset;
      const res = await fetch(`/api/search/episodes?showId=${selectedShow.id}&offset=${newOffset}&limit=20`);
      const data = await res.json();

      if (data.success) {
        const newEpisodes = data.data.episodes || [];
        setEpisodes(prev => [...(prev || []), ...(newEpisodes || [])]);
        setEpisodeOffset(newOffset + 20);
        setHasMoreEpisodes(newEpisodes && newEpisodes.length >= 20);
      } else {
        console.error('Load more episodes API error:', data.error);
      }
    } catch (error) {
      console.error('Load more episodes fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetEpisodeBrowsing = () => {
    setBrowsingEpisodes(false);
    setSelectedShow(null);
    setEpisodes([]);
    setSearchingInShow(false);
    setEpisodeSearchQuery('');
    setSearchedEpisodes([]);
  };

  const toggleSearchMode = () => {
    setSearchingInShow(false);
    setEpisodeSearchQuery('');
    setSearchedEpisodes([]);
  };

  return {
    browsingEpisodes,
    selectedShow,
    episodes,
    hasMoreEpisodes,
    searchingInShow,
    setSearchingInShow,
    episodeSearchQuery,
    setEpisodeSearchQuery,
    searchedEpisodes,
    hasMoreSearchResults,
    loading,
    handleBrowseEpisodes,
    handleEpisodeSearch,
    loadMoreSearchResults,
    loadMoreEpisodes,
    resetEpisodeBrowsing,
    toggleSearchMode,
  };
}
