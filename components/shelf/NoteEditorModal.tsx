'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

const MAX_NOTES_LENGTH = 500;

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
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

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 pr-8">
          {initialNotes ? 'Edit Note' : 'Add Note'}
        </h2>
        <p className="text-sm text-gray-500 mb-4 truncate" title={itemTitle}>
          {itemTitle}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes here..."
            maxLength={MAX_NOTES_LENGTH}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            rows={6}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className={`text-sm ${notes.length >= MAX_NOTES_LENGTH ? 'text-red-500' : 'text-gray-500'}`}>
              {notes.length}/{MAX_NOTES_LENGTH} characters
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
