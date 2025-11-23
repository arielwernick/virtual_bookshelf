'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { AddItemForm } from '@/components/shelf/AddItemForm';
import { ShelfTitleEditor } from '@/components/shelf/ShelfTitleEditor';
import { Modal } from '@/components/ui/Modal';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

const MAX_DESCRIPTION_LENGTH = 500;

export default function EditShelfPage() {
    const params = useParams();
    const router = useRouter();
    const username = params?.username as string;

    const [shelfData, setShelfData] = useState<{ username: string; description: string | null; title: string | null; items: Item[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [description, setDescription] = useState('');
    const [descriptionDirty, setDescriptionDirty] = useState(false);
    const [descriptionSaving, setDescriptionSaving] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.data.username === username) {
                    setAuthenticated(true);
                    fetchShelf();
                    return;
                }
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                setAuthenticated(true);
                fetchShelf();
            } else {
                setAuthError(data.error || 'Invalid password');
            }
        } catch (error) {
            setAuthError('Login failed');
        }
    };

    const fetchShelf = async () => {
        try {
            const res = await fetch(`/api/shelf/${username}`);
            if (res.ok) {
                const data = await res.json();
                setShelfData(data.data);
                setDescription(data.data.description || '');
            }
        } catch (error) {
            console.error('Error fetching shelf:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        setDescriptionDirty(true);
    };

    const handleSaveDescription = async () => {
        setDescriptionSaving(true);
        try {
            const res = await fetch('/api/shelf/update-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });

            if (res.ok) {
                setDescriptionDirty(false);
                // Update the shelf data with new description
                if (shelfData) {
                    setShelfData({ ...shelfData, description });
                }
            }
        } catch (error) {
            console.error('Error saving description:', error);
        } finally {
            setDescriptionSaving(false);
        }
    };

    const handleTitleSave = async (newTitle: string) => {
        try {
            const res = await fetch('/api/shelf/update-title', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle || null }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update title');
            }

            // Update local state with new title
            if (shelfData) {
                setShelfData({ ...shelfData, title: newTitle || null });
            }
            setIsEditingTitle(false);
        } catch (error) {
            throw error instanceof Error ? error : new Error('Failed to update title');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const res = await fetch(`/api/items/${itemId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchShelf();
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push(`/shelf/${username}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full animate-spin mx-auto" style={{ border: '4px solid var(--gray-200)', borderTopColor: 'var(--primary-orange)' }}></div>
                    <p className="mt-4" style={{ color: 'var(--gray-600)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-xl p-8" style={{ border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>Enter Password</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {authError && (
                                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
                                    {authError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                                    Password for {username}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg transition-all"
                                    style={{ 
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--gray-900)'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--primary-orange)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-orange-50)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-full font-semibold transition-all"
                                style={{ 
                                    backgroundColor: 'var(--primary-orange)',
                                    color: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange)'}
                            >
                                Unlock Shelf
                            </button>
                        </form>
                        <Link
                            href={`/shelf/${username}`}
                            className="block mt-4 text-center text-sm font-medium"
                            style={{ color: 'var(--primary-orange)' }}
                        >
                            Back to public view
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {/* Header */}
            <header className="bg-white shadow-sm" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-medium" style={{ color: 'var(--gray-500)' }}>
                            Editing • {shelfData?.items.length || 0} items
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href={`/shelf/${username}`}
                                className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                                style={{ 
                                    border: '2px solid var(--primary-orange)',
                                    color: 'var(--primary-orange)',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange-50)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                View Public Shelf
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                                style={{ 
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--gray-700)',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title Editor */}
                <div className="mb-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                </div>
                {isEditingTitle ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Shelf Title</h2>
                        <ShelfTitleEditor
                            currentTitle={shelfData?.title || null}
                            username={shelfData?.username || ''}
                            onSave={handleTitleSave}
                            onCancel={() => setIsEditingTitle(false)}
                        />
                    </div>
                ) : (
                    <div className="mb-8 flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {shelfData?.title && shelfData.title.trim().length > 0
                                ? shelfData.title
                                : `${shelfData?.username}'s Bookshelf`}
                        </h1>
                        <button
                            onClick={() => setIsEditingTitle(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Edit title"
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
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Description</h2>
                        <div className="space-y-3">
                            <textarea
                                value={description}
                                onChange={handleDescriptionChange}
                                placeholder="Add a description for your shelf..."
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                rows={4}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {description.length}/{MAX_DESCRIPTION_LENGTH} characters
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={descriptionSaving}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
                                    >
                                        {descriptionSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingDescription(false);
                                            setDescriptionDirty(false);
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
                            {description ? (
                                <p className="text-gray-700 leading-relaxed">{description}</p>
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

                {/* Add Item Section */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 rounded-full font-semibold transition-all shadow-md hover:shadow-lg"
                        style={{ 
                            backgroundColor: 'var(--primary-orange)',
                            color: 'white'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        + Add Item
                    </button>
                </div>

                {shelfData && (
                    <ShelfGrid
                        items={shelfData.items}
                        editMode
                        onDeleteItem={handleDeleteItem}
                    />
                )}
            </main>

            {/* Add Item Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <AddItemForm
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
