'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { ItemModal } from '@/components/shelf/ItemModal';
import { ShareModal } from '@/components/shelf/ShareModal';
import { Confetti } from '@/components/Confetti';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

export default function ShelfPage() {
    const params = useParams();
    const username = params?.username as string;

    const [shelfData, setShelfData] = useState<{ username: string; description: string | null; title: string | null; items: Item[]; created_at: string; share_token?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data.username === username) {
                        setIsOwner(true);
                    }
                }
            } catch (error) {
                // Not authenticated or error, that's fine
            }
        }

        async function fetchShelf() {
            try {
                const res = await fetch(`/api/shelf/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    setShelfData(data.data);
                }
            } catch (error) {
                console.error('Error fetching shelf:', error);
            } finally {
                setLoading(false);
            }
        }

        if (username) {
            checkAuth();
            fetchShelf();
        }
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading shelf...</p>
                </div>
            </div>
        );
    }

    if (!shelfData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4" style={{ fontWeight: 700 }}>404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2" style={{ fontWeight: 600 }}>Shelf Not Found</h2>
                    <p className="text-gray-600 mb-8">This bookshelf doesn't exist.</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 shadow-sm hover:shadow transition-all duration-300 font-semibold">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const displayTitle =
        shelfData.title && shelfData.title.trim().length > 0
            ? shelfData.title
            : `${shelfData.username}'s Bookshelf`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900" style={{ fontWeight: 700 }}>{displayTitle}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {shelfData.items.length} {shelfData.items.length === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-sm font-semibold"
                                style={{ fontWeight: 600 }}
                            >
                                Share Shelf
                            </button>
                            {isOwner && (
                                <Link
                                    href={`/shelf/${username}/edit`}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 shadow-sm hover:shadow transition-all duration-300 text-sm font-semibold"
                                >
                                    Edit Shelf
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {shelfData.description && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-gray-700">{shelfData.description}</p>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ShelfGrid items={shelfData.items} onItemClick={setSelectedItem} />
            </main>

            {/* Item Modal */}
            <ItemModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            {/* Share Modal */}
            {shelfData?.share_token && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    shareToken={shelfData.share_token}
                    onCopy={() => {
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 3500);
                    }}
                />
            )}

            {/* Confetti */}
            {showConfetti && <Confetti />}

            {/* Footer */}
            <footer className="mt-16 border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-gray-500">
                        Powered by{' '}
                        <a href="/" className="font-medium text-gray-900 hover:underline">
                            Virtual Bookshelf
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
