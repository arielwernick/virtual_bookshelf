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
  isAuthenticated: boolean;
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
  isAuthenticated,
}: ImportPreviewListProps) {
  const selectedCount = items.filter((item) => item.selected).length;
  const totalCount = items.length;
  const allSelected = selectedCount === totalCount;
  const noneSelected = selectedCount === 0;

  const canCreate = selectedCount > 0 && shelfTitle.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Header with count and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> links
          {selectedCount !== totalCount && (
            <>, <span className="font-semibold text-amber-600">{selectedCount}</span> selected</>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                       hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={noneSelected}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                       hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
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
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <label htmlFor="shelf-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Shelf Title
        </label>
        <input
          type="text"
          id="shelf-title"
          value={shelfTitle}
          onChange={(e) => onShelfTitleChange(e.target.value)}
          placeholder="e.g., Engineering Blogs, Startup Resources..."
          maxLength={100}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Create button */}
      <div className="flex flex-col items-center gap-2 pt-2">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onCreateShelf}
            disabled={!canCreate || creating}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium
                       bg-amber-500 hover:bg-amber-600 text-white
                       disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-2"
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
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sign up or log in to save your shelf
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/signup?returnTo=/import"
                className="px-4 py-2 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                Sign Up
              </a>
              <a
                href="/login?returnTo=/import"
                className="px-4 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Log In
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
