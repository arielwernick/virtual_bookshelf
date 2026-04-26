'use client';

import { ParsedItemPreview, PreviewItem } from './ParsedItemPreview';

interface ImportPreviewListProps {
  items: PreviewItem[];
  shelfTitle: string;
  onShelfTitleChange: (title: string) => void;
  onToggleItem: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCreateShelf: () => void;
  creating: boolean;
}

export function ImportPreviewList({
  items,
  shelfTitle,
  onShelfTitleChange,
  onToggleItem,
  onSelectAll,
  onDeselectAll,
  onCreateShelf,
  creating,
}: ImportPreviewListProps) {
  const selectedCount = items.filter((item) => item.selected).length;
  const totalCount = items.length;
  const allSelected = selectedCount === totalCount;
  const noneSelected = selectedCount === 0;

  const canCreate = selectedCount > 0 && shelfTitle.trim().length > 0;

  return (
    <div className="space-y-4" data-reveal="soft" data-stagger="3">
      {/* Header with count and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-[#1e1919]/70">
          Found <span className="font-semibold text-[#1e1919]">{totalCount}</span> links
          {selectedCount !== totalCount && (
            <>, <span className="font-semibold text-[#0061fe]">{selectedCount}</span> selected</>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-3 py-1.5 text-sm rounded-full border border-[#d9d4cd] 
                       hover:bg-[#f7f5f2] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={noneSelected}
            className="px-3 py-1.5 text-sm rounded-full border border-[#d9d4cd] 
                       hover:bg-[#f7f5f2] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {items.map((item, index) => (
          <ParsedItemPreview
            key={item.url}
            item={item}
            index={index}
            onToggle={onToggleItem}
          />
        ))}
      </div>

      {/* Shelf title input */}
      <div className="pt-4 border-t border-[#e8e4de]">
        <label htmlFor="shelf-title" className="block text-sm font-semibold text-[#1e1919] mb-2">
          Shelf Title
        </label>
        <input
          type="text"
          id="shelf-title"
          value={shelfTitle}
          onChange={(e) => onShelfTitleChange(e.target.value)}
          placeholder="e.g., Engineering Blogs, Startup Resources..."
          maxLength={100}
          className="brand-input w-full px-4 py-2.5 text-[#1e1919] placeholder:text-[#1e1919]/45"
        />
      </div>

      {/* Create button */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCreateShelf}
          disabled={!canCreate || creating}
          className="brand-button w-full sm:w-auto px-6 py-3 font-semibold
                     disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Creating...
            </>
          ) : (
            <>Create Shelf with {selectedCount} Items</>
          )}
        </button>
      </div>
    </div>
  );
}
