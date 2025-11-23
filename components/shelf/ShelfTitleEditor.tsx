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
                <label htmlFor="title-input" className="block text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
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
                    className="w-full px-4 py-3 rounded-lg outline-none disabled:cursor-not-allowed transition-all"
                    style={{ 
                        border: '1px solid var(--border-color)',
                        backgroundColor: loading ? 'var(--gray-100)' : 'var(--background)',
                        color: 'var(--gray-900)'
                    }}
                    onFocus={(e) => {
                        if (!loading) {
                            e.currentTarget.style.borderColor = 'var(--primary-orange)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                        }
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
                <div className="flex justify-between items-center">
                    <p className="text-xs" style={{ color: 'var(--gray-500)' }}>{title.length}/100 characters</p>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                        backgroundColor: loading ? 'var(--gray-400)' : 'var(--primary-orange)',
                        color: 'white'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                    }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                        border: '1px solid var(--border-color)',
                        color: 'var(--gray-700)',
                        backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
