'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { Top5ShelfGrid } from '@/components/shelf/Top5ShelfGrid';
import { AddItemForm } from '@/components/shelf/AddItemForm';
import { NoteEditorModal } from '@/components/shelf/NoteEditorModal';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, BookshelfIcon } from '@/components/ui/EmptyState';
import { SkeletonEditHeader, SkeletonItemGrid } from '@/components/ui/SkeletonLoader';
import { Item, ShelfType } from '@/lib/types/shelf';
import { TOP5_MAX_ITEMS } from '@/lib/utils/top5';
import Link from 'next/link';

const MAX_DESCRIPTION_LENGTH = 500;

interface ShelfData {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    items: Item[];
    share_token: string;
    is_public: boolean;
    shelf_type: ShelfType;
}

export default function EditShelfPage() {
    const params = useParams();
    const router = useRouter();
    const shelfId = params?.shelfId as string;

    const [shelfData, setShelfData] = useState<ShelfData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Note editing state
    const [noteEditItem, setNoteEditItem] = useState<Item | null>(null);
    
    // Editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!shelfId) return;
        checkAuthAndFetch();
    }, [shelfId]);

    const checkAuthAndFetch = async () => {
        try {
            // Check auth first
            const authRes = await fetch('/api/auth/me');
            if (!authRes.ok) {
                router.push('/login');
                return;
            }
            const authJson = await authRes.json();
            const userId = authJson.data.userId;

            // Fetch shelf data
            const shelfRes = await fetch(`/api/shelf/${shelfId}`);
            if (!shelfRes.ok) {
                router.push('/dashboard');
                return;
            }
            const shelfJson = await shelfRes.json();

            // Check ownership
            if (String(userId) !== String(shelfJson.data.user_id)) {
                router.push(`/shelf/${shelfId}`);
                return;
            }

            setShelfData(shelfJson.data);
            setEditName(shelfJson.data.name);
            setEditDescription(shelfJson.data.description || '');
            setAuthorized(true);
        } catch (err) {
            console.error('Error:', err);
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchShelf = async () => {
        try {
            const res = await fetch(`/api/shelf/${shelfId}`);
            if (res.ok) {
                const json = await res.json();
                setShelfData(json.data);
                setEditName(json.data.name);
                setEditDescription(json.data.description || '');
            }
        } catch (err) {
            console.error('Error fetching shelf:', err);
        }
    };

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/shelf/${shelfId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (res.ok) {
                setShelfData(prev => prev ? { ...prev, name: editName.trim() } : null);
                setIsEditingName(false);
            }
        } catch (err) {
            console.error('Error saving name:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDescription = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/shelf/${shelfId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: editDescription.trim() || null }),
            });
            if (res.ok) {
                setShelfData(prev => prev ? { ...prev, description: editDescription.trim() || null } : null);
                setIsEditingDescription(false);
            }
        } catch (err) {
            console.error('Error saving description:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchShelf();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleReorder = async (itemIds: string[]) => {
        try {
            const res = await fetch(`/api/shelf/${shelfId}/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_ids: itemIds }),
            });
            if (res.ok) {
                fetchShelf();
            }
        } catch (err) {
            console.error('Reorder error:', err);
        }
    };

    const handleSaveNote = async (notes: string | null) => {
        if (!noteEditItem) return;
        
        const res = await fetch(`/api/items/${noteEditItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
        });
        
        if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error || 'Failed to save notes');
        }
        
        // Update local state
        setShelfData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item => 
                    item.id === noteEditItem.id ? { ...item, notes } : item
                )
            };
        });
    };

    const handleDeleteShelf = async () => {
        if (!confirm('Are you sure you want to delete this shelf and all its items? This cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/shelf/${shelfId}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error('Delete shelf error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Header Skeleton */}
                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="flex gap-3">
                                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </header>
                {/* Main Content Skeleton */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SkeletonEditHeader />
                    <SkeletonItemGrid count={6} />
                </main>
            </div>
        );
    }

    if (!authorized || !shelfData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Editing • {shelfData.items.length} items
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href={`/shelf/${shelfId}`}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                                View Shelf
                            </Link>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Name Editor */}
                <div className="mb-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
                </div>
                {isEditingName ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                maxLength={100}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveName}
                                    disabled={saving || !editName.trim()}
                                    className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-600 dark:disabled:bg-gray-400 transition-colors text-sm font-medium"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setEditName(shelfData.name);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{shelfData.name}</h1>
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Edit name"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Description Editor */}
                <div className="mb-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</label>
                </div>
                {isEditingDescription ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
                        <div className="space-y-3">
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Add a description for your shelf..."
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                rows={4}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {editDescription.length}/{MAX_DESCRIPTION_LENGTH} characters
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={saving}
                                        className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-600 dark:disabled:bg-gray-400 transition-colors text-sm font-medium"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingDescription(false);
                                            setEditDescription(shelfData.description || '');
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 flex items-start gap-3">
                        <div className="flex-1">
                            {shelfData.description ? (
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{shelfData.description}</p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 italic">No description yet</p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsEditingDescription(true)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                            title="Edit description"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Add Item Button - Hide when Top 5 shelf is full */}
                {!(shelfData.shelf_type === 'top5' && shelfData.items.length >= TOP5_MAX_ITEMS) && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                        >
                            + Add Item
                            {shelfData.shelf_type === 'top5' && (
                                <span className="ml-2 text-gray-300 dark:text-gray-600">
                                    ({shelfData.items.length}/{TOP5_MAX_ITEMS})
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Top 5 shelf is full message */}
                {shelfData.shelf_type === 'top5' && shelfData.items.length >= TOP5_MAX_ITEMS && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                            </svg>
                            <span className="font-medium">Your Top 5 is complete!</span>
                        </div>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            Remove an item to add a different one, or use the reorder buttons to change rankings.
                        </p>
                    </div>
                )}

                {/* Items Grid */}
                {shelfData.shelf_type === 'top5' ? (
                    <Top5ShelfGrid
                        items={shelfData.items}
                        editMode
                        onDeleteItem={handleDeleteItem}
                        onReorder={handleReorder}
                    />
                ) : shelfData.items.length === 0 ? (
                    <EmptyState
                        icon={<BookshelfIcon />}
                        heading="No items yet"
                        subheading="Click the Add Item button above to get started!"
                    />
                ) : (
                    <ShelfGrid
                        items={shelfData.items}
                        editMode
                        onDeleteItem={handleDeleteItem}
                        onEditNote={(item) => setNoteEditItem(item)}
                    />
                )}

                {/* Delete Shelf Section */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Deleting this shelf will permanently remove it and all its items.
                    </p>
                    <button
                        onClick={handleDeleteShelf}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Delete Shelf
                    </button>
                </div>
            </main>

            {/* Add Item Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <AddItemForm
                    shelfId={shelfId}
                    onItemAdded={() => {
                        setShowAddModal(false);
                        fetchShelf();
                    }}
                    onClose={() => setShowAddModal(false)}
                />
            </Modal>

            {/* Note Editor Modal */}
            {noteEditItem && (
                <NoteEditorModal
                    isOpen={true}
                    onClose={() => setNoteEditItem(null)}
                    itemTitle={noteEditItem.title}
                    initialNotes={noteEditItem.notes}
                    onSave={handleSaveNote}
                />
            )}
        </div>
    );
}
