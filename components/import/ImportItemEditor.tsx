'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { getDomain } from '@/lib/utils/urlResolver';
import { PreviewItem, getPreviewTitle } from './ParsedItemPreview';

export const MAX_PREVIEW_TITLE_LENGTH = 200;
export const MAX_PREVIEW_NOTE_LENGTH = 2000;

interface ImportItemEditorProps {
  /** The item being edited, or null when the editor is closed */
  item: PreviewItem | null;
  onSave: (changes: { title: string; note: string }) => void;
  onClose: () => void;
}

/**
 * Lets a visitor fix an item's title and say why it is on the shelf, before
 * anything is saved.
 */
export function ImportItemEditor({ item, onSave, onClose }: ImportItemEditorProps) {
  return (
    <Modal isOpen={item !== null} onClose={onClose}>
      {/* Keyed so the fields start from the item that was opened */}
      {item && <EditorForm key={item.url} item={item} onSave={onSave} onClose={onClose} />}
    </Modal>
  );
}

function EditorForm({ item, onSave, onClose }: { item: PreviewItem } & Omit<ImportItemEditorProps, 'item'>) {
  const [title, setTitle] = useState(getPreviewTitle(item));
  const [note, setNote] = useState(item.parsedDescription ?? '');
  const domain = getDomain(item.resolvedUrl || item.url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title: title.trim(), note: note.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-8">Edit item</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{domain}</p>

      <label htmlFor="import-item-title" className="block mt-5 text-sm font-medium text-gray-700 dark:text-gray-300">
        Title
      </label>
      <input
        id="import-item-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_PREVIEW_TITLE_LENGTH}
        className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
      />

      <label htmlFor="import-item-note" className="block mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        Why it&apos;s on your shelf
      </label>
      <textarea
        id="import-item-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={MAX_PREVIEW_NOTE_LENGTH}
        placeholder="One line is plenty."
        className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-y"
      />

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
}
