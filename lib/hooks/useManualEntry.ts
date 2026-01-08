import { useState } from 'react';
import { ItemType } from '@/lib/types/shelf';

export interface ManualEntryData {
  title: string;
  creator: string;
  image_url: string;
  external_url: string;
  notes: string;
  rating: number | null;
}

export function useManualEntry() {
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState<ManualEntryData>({
    title: '',
    creator: '',
    image_url: '',
    external_url: '',
    notes: '',
    rating: null,
  });
  const [adding, setAdding] = useState(false);

  const handleManualAdd = async (shelfId: string, itemType: ItemType, onSuccess: () => void) => {
    if (!manualData.title || !manualData.creator) {
      alert('Title and creator are required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelf_id: shelfId,
          type: itemType,
          ...manualData,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  return {
    manualMode,
    setManualMode,
    manualData,
    setManualData,
    adding,
    handleManualAdd,
  };
}
