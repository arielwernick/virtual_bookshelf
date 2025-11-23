'use client';

import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
  onCopy?: () => void;
}

type TabType = 'link' | 'embed';

export function ShareModal({ isOpen, onClose, shareToken, onCopy }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('link');

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareToken}`;
  const embedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${shareToken}`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="800" style="border:none;border-radius:8px;" title="Bookshelf"></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Share Your Shelf</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-all"
            style={{ color: 'var(--gray-500)' }}
            title="Close"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
              e.currentTarget.style.color = 'var(--gray-700)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--gray-500)';
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('link')}
            className="flex-1 py-2 text-sm font-semibold border-b-2 transition-all"
            style={
              activeTab === 'link'
                ? { borderColor: 'var(--primary-orange)', color: 'var(--primary-orange)' }
                : { borderColor: 'transparent', color: 'var(--gray-600)' }
            }
            onMouseEnter={(e) => {
              if (activeTab !== 'link') {
                e.currentTarget.style.color = 'var(--gray-900)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'link') {
                e.currentTarget.style.color = 'var(--gray-600)';
              }
            }}
          >
            Share Link
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className="flex-1 py-2 text-sm font-semibold border-b-2 transition-all"
            style={
              activeTab === 'embed'
                ? { borderColor: 'var(--primary-orange)', color: 'var(--primary-orange)' }
                : { borderColor: 'transparent', color: 'var(--gray-600)' }
            }
            onMouseEnter={(e) => {
              if (activeTab !== 'embed') {
                e.currentTarget.style.color = 'var(--gray-900)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'embed') {
                e.currentTarget.style.color = 'var(--gray-600)';
              }
            }}
          >
            Embed
          </button>
        </div>

        {/* Share Link Tab */}
        {activeTab === 'link' && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
              Share a read-only link to your bookshelf with anyone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ 
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--gray-50)',
                    color: 'var(--gray-600)'
                  }}
                />
                <button
                  onClick={() => handleCopy(shareUrl)}
                  className="px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap"
                  style={{ 
                    backgroundColor: copied ? '#10b981' : 'var(--primary-orange)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--primary-orange-50)', border: '1px solid var(--primary-orange-100)' }}>
              <p className="text-xs" style={{ color: 'var(--primary-orange-dark)' }}>
                <strong>Tip:</strong> Anyone with this link can view your shelf and notes, but cannot edit them.
              </p>
            </div>
          </div>
        )}

        {/* Embed Tab */}
        {activeTab === 'embed' && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
              Embed your bookshelf on your website.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                Embed Code
              </label>
              <textarea
                value={embedCode}
                readOnly
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none font-mono"
                style={{ 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--gray-50)',
                  color: 'var(--gray-600)'
                }}
              />
              <button
                onClick={() => handleCopy(embedCode)}
                className="w-full mt-2 py-2 rounded-full font-semibold text-sm transition-all"
                style={{ 
                  backgroundColor: copied ? '#10b981' : 'var(--primary-orange)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                }}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--primary-orange-50)', border: '1px solid var(--primary-orange-100)' }}>
              <p className="text-xs" style={{ color: 'var(--primary-orange-dark)' }}>
                <strong>Tip:</strong> Paste this code into your website HTML to embed your shelf.
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-full font-semibold text-sm mt-4 transition-all"
          style={{ 
            border: '1px solid var(--border-color)',
            color: 'var(--gray-700)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Close
        </button>
      </div>
    </div>
  );
}
