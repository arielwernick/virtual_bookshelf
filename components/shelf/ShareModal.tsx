'use client';

import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
}

type TabType = 'link' | 'embed';

export function ShareModal({ isOpen, onClose, shareToken }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('link');

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareToken}`;
  const embedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${shareToken}`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="800" style="border:none;border-radius:8px;" title="Bookshelf"></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share Your Shelf</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'embed'
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
                  onClick={() => handleCopy(shareUrl)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                    copied
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
                onClick={() => handleCopy(embedCode)}
                className={`w-full mt-2 py-2 rounded-lg font-medium text-sm transition-colors ${
                  copied
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
    </div>
  );
}
