'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { AddItemForm } from '@/components/shelf/AddItemForm';
import { Modal } from '@/components/ui/Modal';
import { Item } from '@/lib/types/shelf';
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
}

export default function EditShelfPage() {
    const params = useParams();
    const router = useRouter();
    const shelfId = params?.shelfId as string;

    const [shelfData, setShelfData] = useState<ShelfData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!authorized || !shelfData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Editing • {shelfData.items.length} items
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href={`/shelf/${shelfId}`}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                View Shelf
                            </Link>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
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
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                </div>
                {isEditingName ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                maxLength={100}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveName}
                                    disabled={saving || !editName.trim()}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setEditName(shelfData.name);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{shelfData.name}</h1>
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
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
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                </div>
                {isEditingDescription ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <div className="space-y-3">
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Add a description for your shelf..."
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                rows={4}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {editDescription.length}/{MAX_DESCRIPTION_LENGTH} characters
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={saving}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingDescription(false);
                                            setEditDescription(shelfData.description || '');
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
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
                                <p className="text-gray-700 leading-relaxed">{shelfData.description}</p>
                            ) : (
                                <p className="text-gray-400 italic">No description yet</p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsEditingDescription(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                            title="Edit description"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Add Item Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        + Add Item
                    </button>
                </div>

                {/* Items Grid */}
                {shelfData.items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No items yet</h3>
                        <p className="text-gray-600">Click &quot;+ Add Item&quot; to get started!</p>
                    </div>
                ) : (
                    <ShelfGrid
                        items={shelfData.items}
                        editMode
                        onDeleteItem={handleDeleteItem}
                    />
                )}

                {/* Delete Shelf Section */}
                <div className="mt-16 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-gray-600 mb-4">
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
        </div>
    );
}
