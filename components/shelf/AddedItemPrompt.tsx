'use client';

import { useState } from 'react';
import type { AddedItem } from './AddItemForm';

const MAX_NOTE_LENGTH = 500;

interface AddedItemPromptProps {
  /** The item just added, when known. Without it only the confirmation shows. */
  item?: AddedItem;
  /** How many items have been added since the form was opened. */
  count: number;
  /** Called after a note is saved, so the caller can refresh its list. */
  onNoteSaved?: () => void;
}

/**
 * Shown after an item is added, in place of closing the form (issue #292).
 *
 * It confirms the add, keeps the person where they can add another, and asks
 * the one question that makes a shelf worth sharing: why this one? The note
 * is optional and saved to the item that was just created.
 */
export function AddedItemPrompt({ item, count, onNoteSaved }: AddedItemPromptProps) {
  if (count === 0) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-4"
    >
      <p className="text-sm font-medium text-green-900 dark:text-green-200">
        {item ? <>Added &ldquo;{item.title}&rdquo;.</> : 'Added.'}{' '}
        <span className="font-normal">
          {count === 1 ? '1 item so far.' : `${count} items so far.`} Add another below, or
          you&apos;re done.
        </span>
      </p>

      {/* Keyed by item, so a new item gets a fresh, empty note box */}
      {item && <NoteBox key={item.id} item={item} onNoteSaved={onNoteSaved} />}
    </div>
  );
}

function NoteBox({ item, onNoteSaved }: { item: AddedItem; onNoteSaved?: () => void }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveNote = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;

    setStatus('saving');
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      setStatus('saved');
      onNoteSaved?.();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'saved') {
    return <p className="mt-2 text-sm text-green-800 dark:text-green-300">Note saved.</p>;
  }

  return (
    <div className="mt-3">
      <label htmlFor="added-item-note" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
        Why this one? <span className="text-gray-500 dark:text-gray-400">(optional)</span>
      </label>
      <div className="flex gap-2">
        <input
          id="added-item-note"
          type="text"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveNote();
            }
          }}
          placeholder="One line on why it is on your shelf"
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent"
        />
        <button
          type="button"
          onClick={saveNote}
          disabled={!note.trim() || status === 'saving'}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {status === 'saving' ? 'Saving...' : 'Save note'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          The note could not be saved. You can add it later from the shelf.
        </p>
      )}
    </div>
  );
}
