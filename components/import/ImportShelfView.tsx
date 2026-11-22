'use client';

import { useMemo, useState } from 'react';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item } from '@/lib/types/shelf';
import { detectItemType } from '@/lib/utils/itemTypeDetector';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';
import { getDomain } from '@/lib/utils/urlResolver';
import { PreviewItem, getPreviewTitle } from './ParsedItemPreview';

/**
 * A preview item as the shelf item it will become once saved. Mirrors what
 * /api/import/create stores, so the preview looks and behaves like the real
 * shelf (type, cover, item window, Spotify player, book details).
 */
export function toShelfItem(item: PreviewItem, index: number): Item {
  const url = item.resolvedUrl || item.url;
  const type = detectItemType(url);
  const creator = item.fetchedPublisher || getDomain(url);
  const identity = deriveItemIdentity(type, url, creator);
  const now = new Date(0);
  return {
    id: `preview-${index}-${item.url}`,
    shelf_id: 'preview',
    user_id: null,
    type,
    title: getPreviewTitle(item),
    creator,
    image_url: item.fetchedImage || null,
    external_url: url,
    notes: item.parsedDescription?.trim() || null,
    rating: null,
    order_index: index,
    source: identity?.source ?? null,
    source_id: identity?.sourceId ?? null,
    created_at: now,
    updated_at: now,
  };
}

interface ImportShelfViewProps {
  items: PreviewItem[];
}

/**
 * The pasted list shown read-only, exactly as a saved shelf: the same grid,
 * and clicking an item opens the same item window.
 */
export function ImportShelfView({ items }: ImportShelfViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const shelfItems = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.selected)
        .map(({ item, index }) => toShelfItem(item, index)),
    [items]
  );

  return (
    <div data-testid="import-shelf-view">
      <ShelfGrid items={shelfItems} onItemClick={setSelectedItem} />
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        items={shelfItems}
        onNavigate={setSelectedItem}
      />
    </div>
  );
}
