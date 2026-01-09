'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareToken: string;
    isPublic?: boolean;
    onPublishToggle?: (isPublic: boolean) => Promise<void>;
    onCopy?: () => void;
}

type TabType = 'link' | 'embed';

export function ShareModal({ isOpen, onClose, shareToken, isPublic = false, onPublishToggle, onCopy }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('link');
    const [isPublishing, setIsPublishing] = useState(false);
    const { showToast } = useToast();

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareToken}`;
    const embedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${shareToken}`;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="800" style="border:none;border-radius:8px;" title="Bookshelf"></iframe>`;

    const handleCopy = (text: string, type: 'link' | 'embed' = 'link') => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();
        showToast(type === 'link' ? 'Link copied to clipboard!' : 'Embed code copied!', 'success', '📋');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePublishToggle = async () => {
        if (!onPublishToggle) return;
        setIsPublishing(true);
        try {
            await onPublishToggle(!isPublic);
        } catch (error) {
            console.error('Failed to toggle publish:', error);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">Share Your Shelf</h2>

                {/* Publish Status */}
                <div className="mb-4">
                    {isPublic ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-green-800">
                                <strong>Published!</strong> Your shelf is publicly visible with the link below.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Not published yet.</strong> Publish your shelf to make it accessible via the link below.
                            </p>
                        </div>
                    )}

                    {onPublishToggle && (
                        <button
                            onClick={handlePublishToggle}
                            disabled={isPublishing}
                            className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${isPublic
                                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                }`}
                        >
                            {isPublishing ? 'Updating...' : isPublic ? 'Unpublish Shelf' : 'Publish Shelf'}
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mb-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'link'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab('embed')}
                        className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'embed'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Embed
                    </button>
                </div>

                {/* Share Link Tab */}
                {activeTab === 'link' && (
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Share a read-only link to your bookshelf with anyone.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Share Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600 focus:outline-none"
                                />
                                <button
                                    onClick={() => handleCopy(shareUrl, 'link')}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${copied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>Tip:</strong> Anyone with this link can view your shelf and notes, but cannot edit them.
                            </p>
                        </div>
                    </div>
                )}

                {/* Embed Tab */}
                {activeTab === 'embed' && (
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Embed your bookshelf on your website.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Embed Code
                            </label>
                            <textarea
                                value={embedCode}
                                readOnly
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-600 focus:outline-none font-mono"
                            />
                            <button
                                onClick={() => handleCopy(embedCode, 'embed')}
                                className={`w-full mt-2 py-2 rounded-lg font-medium text-sm transition-colors ${copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>Tip:</strong> Paste this code into your website HTML to embed your shelf.
                            </p>
                        </div>
                    </div>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm mt-4"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}
