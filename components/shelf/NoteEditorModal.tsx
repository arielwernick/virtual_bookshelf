'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

const MAX_NOTES_LENGTH = 500;

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  initialNotes: string | null;
  onSave: (notes: string | null) => Promise<void>;
}

export function NoteEditorModal({
  isOpen,
  onClose,
  itemTitle,
  initialNotes,
  onSave,
}: NoteEditorModalProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset notes when modal opens with new initial value
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes || '');
      setError(null);
    }
  }, [isOpen, initialNotes]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save empty string as null
      await onSave(notes.trim() || null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || '');
    setError(null);
    onClose();
  };

  const handleRemoveNote = async () => {
    if (!initialNotes) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6">
        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {initialNotes ? 'Edit Note' : 'Add Note'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={itemTitle}>
              {itemTitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share your thoughts, favorite quotes, or why you love this..."
            maxLength={MAX_NOTES_LENGTH}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            rows={5}
            autoFocus
          />
          <div className="flex items-center justify-between text-sm">
            <span className={`${notes.length >= MAX_NOTES_LENGTH ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              {notes.length}/{MAX_NOTES_LENGTH}
            </span>
            {initialNotes && (
              <button
                onClick={handleRemoveNote}
                disabled={saving}
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
              >
                Remove note
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || notes.trim() === (initialNotes?.trim() || '')}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving
              </span>
            ) : 'Save Note'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
