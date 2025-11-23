'use client';

import { useState, useRef, useEffect } from 'react';

interface ShelfTitleEditorProps {
    currentTitle: string | null;
    username: string;
    onSave: (newTitle: string) => Promise<void>;
    onCancel: () => void;
}

export function ShelfTitleEditor({ currentTitle, username, onSave, onCancel }: ShelfTitleEditorProps) {
    const [title, setTitle] = useState(currentTitle || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSave = async () => {
        try {
            setError(null);
            setLoading(true);

            // Validate title length
            if (title.length > 100) {
                setError('Title must be 100 characters or less');
                setLoading(false);
                return;
            }

            await onSave(title);
            setLoading(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to save title';
            setError(errorMsg);
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const displayTitle = currentTitle && currentTitle.trim().length > 0 ? currentTitle : `${username}'s Bookshelf`;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="title-input" className="block text-sm font-medium text-gray-700" style={{ fontWeight: 500 }}>
                    Shelf Title
                </label>
                <input
                    ref={inputRef}
                    id="title-input"
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={displayTitle}
                    maxLength={100}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{title.length}/100 characters</p>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 shadow-sm hover:shadow transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontWeight: 600 }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
