'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AddItemForm } from '@/components/shelf/AddItemForm';
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
  const [hasAddedItems, setHasAddedItems] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleItemAdded = () => {
    setHasAddedItems(true);
    onItemAdded();
  };

  // Trigger entrance animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleViewShelf = () => {
    router.push(`/shelf/${shelfId}`);
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
            <div className={`transform transition-all duration-500 ${isAnimating ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
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
          <div className={`transform transition-all duration-700 delay-200 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Shelf Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">"{shelfName}"</span> is ready to go
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Let's add your first item ✨
            </p>
          </div>
        </div>

        {/* Add Item Form */}
        <div className={`mb-6 transform transition-all duration-700 delay-400 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <AddItemForm
            shelfId={shelfId}
            onItemAdded={handleItemAdded}
          />
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 transform transition-all duration-700 delay-500 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <button
            onClick={handleViewShelf}
            className="flex-1 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-center transform hover:scale-105 active:scale-95"
          >
            {hasAddedItems ? 'View My Shelf' : 'View Empty Shelf'}
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-center transform hover:scale-105 active:scale-95"
          >
            {hasAddedItems ? 'Back to Dashboard' : 'Add Items Later'}
          </button>
        </div>

        {/* Helper Text */}
        <p className={`text-xs text-gray-500 dark:text-gray-400 text-center mt-3 transform transition-all duration-700 delay-600 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          You can always add or edit items later from your shelf page
        </p>
      </div>
    </Modal>
  );
}