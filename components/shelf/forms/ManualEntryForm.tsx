'use client';

import { ItemType } from '@/lib/types/shelf';
import { StarInput } from '@/components/ui/StarInput';
import { ManualEntryData } from '@/lib/hooks/useManualEntry';

interface ManualEntryFormProps {
  itemType: ItemType;
  manualData: ManualEntryData;
  setManualData: (data: ManualEntryData) => void;
  onSubmit: () => void;
  adding: boolean;
}

export function ManualEntryForm({
  itemType,
  manualData,
  setManualData,
  onSubmit,
  adding,
}: ManualEntryFormProps) {
  const getCreatorLabel = () => {
    if (itemType === 'book') return 'Author';
    if (itemType === 'podcast') return 'Host';
    return 'Artist';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
        <input
          type="text"
          value={manualData.title}
          onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {getCreatorLabel()} *
        </label>
        <input
          type="text"
          value={manualData.creator}
          onChange={(e) => setManualData({ ...manualData, creator: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
        <input
          type="url"
          value={manualData.image_url}
          onChange={(e) => setManualData({ ...manualData, image_url: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External URL</label>
        <input
          type="url"
          value={manualData.external_url}
          onChange={(e) => setManualData({ ...manualData, external_url: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <textarea
          value={manualData.notes}
          onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder="Why do you like this?"
        />
      </div>

      <div>
        <StarInput
          value={manualData.rating}
          onChange={(rating) => setManualData({ ...manualData, rating })}
          label="Rating"
          size="md"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={adding}
        className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
      >
        {adding ? 'Adding...' : 'Add to Shelf'}
      </button>
    </div>
  );
}
