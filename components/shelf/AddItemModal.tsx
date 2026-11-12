'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AddItemForm, AddedItem } from '@/components/shelf/AddItemForm';
import { AddedItemPrompt } from '@/components/shelf/AddedItemPrompt';
import { useRouter } from 'next/navigation';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelfId: string;
  shelfName: string;
  onItemAdded: () => void;
}

export function AddItemModal({ 
  isOpen, 
  onClose, 
  shelfId, 
  shelfName, 
  onItemAdded 
}: AddItemModalProps) {
  const router = useRouter();
  const [addedCount, setAddedCount] = useState(0);
  const [lastAdded, setLastAdded] = useState<AddedItem | undefined>();
  const hasAddedItems = addedCount > 0;

  // Stay in the form after an add. It used to send the person to the
  // read-only shelf page a second later, so adding a second item meant
  // finding "Edit Shelf" and "Add Item" again (issue #292).
  const handleItemAdded = (item?: AddedItem) => {
    setAddedCount((count) => count + 1);
    setLastAdded(item);
    onItemAdded();
  };

  // Handle animation state based on modal visibility
  // Use isOpen directly in classes instead of separate animation state to avoid effect issues
  const animationClasses = {
    icon: `transform transition-all duration-500 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`,
    content: `transform transition-all duration-700 delay-200 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`,
    form: `transform transition-all duration-700 delay-400 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`,
    actions: `transform transition-all duration-700 delay-600 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`
  };

  // With items on it, "done" lands on the edit page, where the shelf can be
  // arranged, annotated and published.
  const handleViewShelf = () => {
    router.push(hasAddedItems ? `/shelf/${shelfId}/edit` : `/shelf/${shelfId}`);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Success Header */}
        <div className="mb-6 text-center">
          <div className="mb-4">
            <div className={animationClasses.icon}>
              <svg 
                className="w-12 h-12 mx-auto text-green-500 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
          <div className={animationClasses.content}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Shelf Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">&ldquo;{shelfName}&rdquo;</span> is ready to go
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {hasAddedItems ? 'Keep going, add another' : "Let's add your first item ✨"}
            </p>
          </div>
        </div>

        {/* Add Item Form */}
        <div className={`mb-6 ${animationClasses.form}`}>
          <AddedItemPrompt item={lastAdded} count={addedCount} onNoteSaved={onItemAdded} />
          <AddItemForm
            shelfId={shelfId}
            onItemAdded={handleItemAdded}
          />
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 ${animationClasses.actions}`}>
          <button
            onClick={handleViewShelf}
            className="flex-1 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-center transform hover:scale-105 active:scale-95"
          >
            {hasAddedItems ? 'Done' : 'View Empty Shelf'}
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-center transform hover:scale-105 active:scale-95"
          >
            {hasAddedItems ? 'Back to My Shelves' : 'Add Items Later'}
          </button>
        </div>

        {/* Helper Text */}
        <p className={`text-xs text-gray-500 dark:text-gray-400 text-center mt-3 ${animationClasses.actions}`}>
          {hasAddedItems 
            ? 'Done takes you to your shelf, where you can arrange it and share it' 
            : 'You can always add or edit items later from your shelf page'
          }
        </p>
      </div>
    </Modal>
  );
}