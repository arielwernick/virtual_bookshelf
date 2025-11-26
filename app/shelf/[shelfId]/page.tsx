'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { ShareModal } from '@/components/shelf/ShareModal';
import { Confetti } from '@/components/Confetti';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

interface ShelfPageData {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    items: Item[];
    created_at: string;
    share_token: string;
    is_public: boolean;
}

export default function ShelfPage() {
    const params = useParams();
    const router = useRouter();
    const shelfId = params?.shelfId as string;

    const [shelfData, setShelfData] = useState<ShelfPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        if (!shelfId) return;

        const fetchShelfData = async () => {
            try {
                const res = await fetch(`/api/shelf/${shelfId}`);
                if (!res.ok) {
                    const errorMessage =
                        res.status === 404 ? 'Shelf not found' :
                            res.status === 403 ? 'You do not have permission to view this shelf' :
                                'Failed to load shelf';
                    setError(errorMessage);
                    return;
                }

                const { data } = await res.json();
                setShelfData(data);
                setEditName(data.name);
                setEditDescription(data.description || '');
            } catch (error) {
                console.error('Error fetching shelf:', error);
                setError('Failed to load shelf');
            } finally {
                setLoading(false);
            }
        };

        const checkOwnership = async (shelf: ShelfPageData) => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const { data } = await res.json();
                    setIsOwner(data.userId === shelf.user_id);
                }
            } catch (error) {
                // Not authenticated is fine - user can still view public shelves
            }
        };

        fetchShelfData().then(() => {
            // Check ownership after fetching shelf
            if (shelfData) checkOwnership(shelfData);
        });
    }, [shelfId]);

    const handleItemClick = (item: Item) => {
        setSelectedItem(item);
    };

    const handleDeleteShelf = async () => {
        if (!confirm('Are you sure you want to delete this shelf and all its items? This cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/shelf/${shelfId}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert('Failed to delete shelf');
            }
        } catch (error) {
            console.error('Error deleting shelf:', error);
            alert('Failed to delete shelf');
        }
    };

    const handleSaveChanges = async () => {
        try {
            const res = await fetch(`/api/shelf/${shelfId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription || null,
                }),
            });

            if (res.ok) {
                setShelfData((prev) =>
                    prev
                        ? {
                            ...prev,
                            name: editName,
                            description: editDescription || null,
                        }
                        : null
                );
                setIsEditing(false);
            } else {
                alert('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes');
        }
    };

    const handlePublishToggle = async (isPublic: boolean) => {
        try {
            const res = await fetch(`/api/shelf/${shelfId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_public: isPublic }),
            });

            if (!res.ok) {
                throw new Error('Failed to update publish status');
            }

            setShelfData((prev) =>
                prev ? { ...prev, is_public: isPublic } : null
            );

            // Show confetti when publishing
            if (isPublic) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
        } catch (error) {
            console.error('Error toggling publish:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-gray-600">Loading shelf...</div>
            </div>
        );
    }

    if (error || !shelfData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Shelf not found'}</h1>
                    <Link href="/" className="text-gray-600 hover:text-gray-900">
                        ← Go back home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {showConfetti && <Confetti />}

            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-start justify-between mb-4">
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                            ← Back to Dashboard
                        </Link>
                        {isOwner && (
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setShowShareModal(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            Share
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDeleteShelf}
                                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSaveChanges}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditName(shelfData.name);
                                                setEditDescription(shelfData.description || '');
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-3xl font-bold text-gray-900 w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full px-2 py-1 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{shelfData.name}</h1>
                            {shelfData.description && <p className="text-gray-600">{shelfData.description}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {shelfData.items.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-6">This shelf is empty</p>
                        {isOwner && (
                            <Link
                                href={`/shelf/${shelfId}/add`}
                                className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Add Items
                            </Link>
                        )}
                    </div>
                ) : (
                    <ShelfGrid items={shelfData.items} onItemClick={handleItemClick} />
                )}
            </div>

            {/* Modals */}
            <ItemModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
            <ShareModal
                isOpen={showShareModal}
                shareToken={shelfData.share_token}
                isPublic={shelfData.is_public}
                onPublishToggle={handlePublishToggle}
                onClose={() => setShowShareModal(false)}
            />
        </div>
    );
}
