'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item } from '@/lib/types/shelf';

interface ShelfPayload {
  name?: string;
  items: Item[];
}

function normalizeHex(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const stripped = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(stripped)) {
    return undefined;
  }
  return `#${stripped}`;
}

export function EmbedShelf() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareToken = params?.shareToken as string;

  const theme = searchParams?.get('theme');
  const bgParam = searchParams?.get('bg');
  const accent = normalizeHex(searchParams?.get('accent') ?? null);
  const customBg = bgParam && bgParam !== 'transparent' ? normalizeHex(bgParam) : undefined;
  const transparentBg = bgParam === 'transparent';
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  const wrapperBg = transparentBg
    ? 'transparent'
    : customBg
    ? customBg
    : isDark
    ? '#0a0a0a'
    : isLight
    ? '#ffffff'
    : undefined;

  const wrapperFg = transparentBg
    ? undefined
    : isDark
    ? '#ededed'
    : isLight
    ? '#171717'
    : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const [shelfData, setShelfData] = useState<ShelfPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Apply background to the iframe document body so the embed can be transparent / themed.
  useEffect(() => {
    const body = document.body;
    const original = body.style.background;
    if (transparentBg) {
      body.style.background = 'transparent';
    } else if (customBg) {
      body.style.background = customBg;
    } else if (isDark) {
      body.style.background = '#0a0a0a';
    } else if (isLight) {
      body.style.background = '#ffffff';
    }
    return () => {
      body.style.background = original;
    };
  }, [transparentBg, customBg, isDark, isLight]);

  useEffect(() => {
    async function fetchShelf() {
      try {
        const res = await fetch(`/api/shelf/share/${shareToken}`);
        if (res.ok) {
          const data = await res.json();
          setShelfData(data.data);
        }
      } catch (error) {
        console.error('Error fetching shelf:', error);
      } finally {
        setLoading(false);
      }
    }
    if (shareToken) fetchShelf();
  }, [shareToken]);

  // Broadcast content height to the parent window so the host can auto-size the iframe.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sendHeight = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      try {
        window.parent?.postMessage({ type: 'bookshelf-height', height }, '*');
      } catch {
        // Cross-origin parent without listener — ignore.
      }
    };

    sendHeight();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sendHeight) : null;
    if (ro) ro.observe(document.body);
    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('load', sendHeight);
      window.removeEventListener('resize', sendHeight);
    };
  }, [loading, shelfData, selectedItem]);

  const wrapperStyle: React.CSSProperties = {
    background: wrapperBg,
    color: wrapperFg,
    ...(accent ? { ['--embed-accent' as string]: accent } : {}),
  };

  if (loading) {
    return (
      <div ref={containerRef} className="w-full p-3 sm:p-4" style={wrapperStyle}>
        <div className="animate-pulse">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-md aspect-[2/3]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shelfData) {
    return (
      <div
        ref={containerRef}
        className="min-h-[160px] flex items-center justify-center px-4 py-8"
        style={wrapperStyle}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">Shelf not found</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={wrapperStyle}>
      <div className="p-3 sm:p-4">
        <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
      </div>
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      <div className="flex justify-end px-3 pt-1 pb-3 sm:px-4 sm:pb-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by Virtual Bookshelf"
          style={accent ? { backgroundColor: accent } : undefined}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-black transition-colors"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="8" width="2" height="10" />
            <rect x="4.5" y="6" width="2" height="12" />
            <rect x="7" y="7" width="2" height="11" />
            <rect x="9.5" y="5" width="2" height="13" />
            <rect x="12" y="7" width="2" height="11" />
            <rect x="14.5" y="6" width="2" height="12" />
            <rect x="17" y="8" width="2" height="10" />
            <rect x="19.5" y="7" width="2" height="11" />
          </svg>
          <span>Virtual Bookshelf</span>
        </Link>
      </div>
    </div>
  );
}
