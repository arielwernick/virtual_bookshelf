'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StarInput } from '@/components/ui/StarInput';

const MAX_NOTES_LENGTH = 500;
const CHAR_COUNT_THRESHOLD = 0.8; // Show count at 80%

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  initialNotes: string | null;
  initialRating: number | null;
  onSave: (notes: string | null, rating: number | null) => Promise<void>;
}

export function NoteEditorModal({
  isOpen,
  onClose,
  itemTitle,
  initialNotes,
  initialRating,
  onSave,
}: NoteEditorModalProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [rating, setRating] = useState<number | null>(initialRating);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset notes and rating when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes || '');
      setRating(initialRating);
      setError(null);
    }
  }, [isOpen, initialNotes, initialRating]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(160, textarea.scrollHeight)}px`;
    }
  }, [notes]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save empty string as null
      await onSave(notes.trim() || null, rating);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || '');
    setRating(initialRating);
    onClose();
  };

  const handleRemoveNote = async () => {
    if (!initialNotes) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(null, rating);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove note');
    } finally {
      setSaving(false);
    }
  };

  const showCharCount = notes.length >= MAX_NOTES_LENGTH * CHAR_COUNT_THRESHOLD;
  const isAtLimit = notes.length >= MAX_NOTES_LENGTH;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6 sm:p-8 max-w-lg w-full">
        {/* Minimal header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {initialNotes ? 'Edit Note' : 'Add Note'}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={itemTitle}>
            {itemTitle}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Rating section */}
        <div className="mb-4">
          <StarInput
            value={rating}
            onChange={setRating}
            label="Rating"
            size="md"
          />
        </div>

        {/* Textarea section */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your thoughts..."
            maxLength={MAX_NOTES_LENGTH}
            className="w-full min-h-[160px] px-4 py-4 text-base leading-relaxed border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent resize-none transition-shadow text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            autoFocus
          />
          
          {/* Footer with conditional char count and remove button */}
          <div className="flex items-center justify-between min-h-[24px]">
            <div>
              {showCharCount && (
                <span className={`text-xs transition-opacity ${isAtLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {notes.length}/{MAX_NOTES_LENGTH}
                </span>
              )}
            </div>
            {initialNotes && (
              <button
                onClick={handleRemoveNote}
                disabled={saving}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium disabled:opacity-50 transition-colors"
              >
                Remove note
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (notes.trim() === (initialNotes?.trim() || '') && rating === initialRating)}
            className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving
              </span>
            ) : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
