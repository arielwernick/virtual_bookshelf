'use client';

import { useState } from 'react';
import { PreviewItem, getPreviewTitle } from './ParsedItemPreview';
import { ImportShelfPreview } from './ImportShelfPreview';
import { ImportShelfView } from './ImportShelfView';

interface ImportPreviewListProps {
  items: PreviewItem[];
  shelfTitle: string;
  onShelfTitleChange: (title: string) => void;
  /** Takes an item off the shelf, or puts it back */
  onToggleItem: (index: number) => void;
  onEditItem: (index: number) => void;
  onCreateShelf: () => void;
  creating: boolean;
  /** When true the visitor has no account yet: offer sign-up instead of save. */
  signedOut?: boolean;
  onSignUpToSave?: () => void;
  onSignInToSave?: () => void;
}

const primaryButton =
  'w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white dark:text-gray-900 ' +
  'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md hover:shadow-lg ' +
  'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed ' +
  'transition-all flex items-center justify-center gap-2';

const toggleButton =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ' +
  'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 ' +
  'hover:border-gray-500 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-500';

/**
 * The preview step: see the list as a finished shelf, switch to edit mode to
 * rename it, tidy items or add notes, then save (or sign up to save).
 */
export function ImportPreviewList({
  items,
  shelfTitle,
  onShelfTitleChange,
  onToggleItem,
  onEditItem,
  onCreateShelf,
  creating,
  signedOut = false,
  onSignUpToSave,
  onSignInToSave,
}: ImportPreviewListProps) {
  // Open as a finished shelf; editing is one tap away
  const [editing, setEditing] = useState(false);
  const removed = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.selected);
  const selectedCount = items.length - removed.length;
  const hasTitle = shelfTitle.trim().length > 0;
  const canCreate = selectedCount > 0 && hasTitle;
  const itemCount = `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}`;

  const hint =
    selectedCount === 0
      ? 'Put at least one item back on the shelf to continue.'
      : !hasTitle
        ? 'Give your shelf a name to continue.'
        : signedOut
          ? 'Free. Your shelf is saved as private until you choose to share it.'
          : 'Saved as private. You can share it whenever you like.';

  return (
    <div className="space-y-5">
      {editing ? (
        <>
          {/* Shelf name, written where the shelf's name will sit */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="shelf-title"
                className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                Shelf name
              </label>
              <button type="button" onClick={() => setEditing(false)} className={toggleButton}>
                Done
              </button>
            </div>
            <input
              type="text"
              id="shelf-title"
              value={shelfTitle}
              onChange={(e) => onShelfTitleChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Name your shelf"
              maxLength={100}
              className="mt-1 w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight
                         text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600
                         border-0 border-b-2 border-gray-200 dark:border-gray-700
                         focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none focus:ring-0
                         px-0 py-1.5 transition-colors"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {itemCount} · tap one to fix its title or add a note
            </p>
          </div>

          {selectedCount > 0 ? (
            <ImportShelfPreview items={items} onRemove={onToggleItem} onEdit={onEditItem} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Your shelf is empty.
            </div>
          )}

          {/* Items taken off the shelf, one tap from coming back */}
          {removed.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Left off the shelf
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {removed.map(({ item, index }) => {
                  const title = getPreviewTitle(item);
                  return (
                    <li key={item.url}>
                      <button
                        type="button"
                        onClick={() => onToggleItem(index)}
                        aria-label={`Put ${title} back`}
                        className="max-w-[220px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                                   border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300
                                   hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100
                                   transition-colors"
                      >
                        <span aria-hidden="true">+</span>
                        <span className="truncate">{title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {/* The shelf as visitors will see it */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${
                  hasTitle ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {hasTitle ? shelfTitle : 'Untitled shelf'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{itemCount}</p>
            </div>
            <button type="button" onClick={() => setEditing(true)} className={`${toggleButton} flex-shrink-0`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit shelf
            </button>
          </div>

          {selectedCount > 0 ? (
            <ImportShelfView items={items} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Your shelf is empty.
            </div>
          )}
        </>
      )}

      {/* Save, or the sign-up step for visitors without an account */}
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        {signedOut ? (
          <button type="button" onClick={onSignUpToSave} disabled={!canCreate} className={primaryButton}>
            Sign up to save this shelf
          </button>
        ) : (
          <button type="button" onClick={onCreateShelf} disabled={!canCreate || creating} className={primaryButton}>
            {creating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>Save this shelf</>
            )}
          </button>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400">{hint}</p>

        {signedOut && (
          <button
            type="button"
            onClick={onSignInToSave}
            disabled={!canCreate}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline
                       disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
