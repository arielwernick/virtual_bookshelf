'use client';

import { useEffect, useRef, useState } from 'react';
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
type EmbedStyle = 'auto' | 'transparent';

const EMBED_STYLE_LABELS: Record<EmbedStyle, string> = {
    auto: 'Auto-sizing (recommended)',
    transparent: 'Fixed height (no script)',
};

const EMBED_STYLE_DESCRIPTIONS: Record<EmbedStyle, string> = {
    auto: 'Transparent background, resizes automatically to fit content.',
    transparent: 'Use this if your site strips <script> tags (e.g. Squarespace, some Notion embeds). Transparent background, fixed height.',
};

const shareModalCelebrationStyles = `
@keyframes celebration-card-in {
    0% { opacity: 0; transform: translateY(8px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes celebration-circle-draw {
    to { stroke-dashoffset: 0; }
}
@keyframes celebration-tick-draw {
    to { stroke-dashoffset: 0; }
}
@keyframes celebration-fade-up {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
}
@keyframes share-link-reveal {
    0% { opacity: 0; transform: translateY(8px) scale(0.98); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    40% { opacity: 1; transform: translateY(0) scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.18); }
    100% { opacity: 1; transform: translateY(0) scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
@keyframes copy-button-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0); }
    50% { box-shadow: 0 0 0 6px rgba(17, 24, 39, 0.12); }
}
.celebration-card {
    animation: celebration-card-in 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.celebration-check-circle {
    stroke-dasharray: 151;
    stroke-dashoffset: 151;
    animation: celebration-circle-draw 0.55s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
}
.celebration-check-tick {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: celebration-tick-draw 0.32s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
}
.celebration-headline {
    opacity: 0;
    animation: celebration-fade-up 0.4s ease-out 0.7s forwards;
}
.celebration-subtext {
    opacity: 0;
    animation: celebration-fade-up 0.4s ease-out 0.85s forwards;
}
.share-link-reveal {
    border-radius: 12px;
    animation: share-link-reveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both;
}
.copy-button-pulse {
    animation: copy-button-pulse 1.6s ease-in-out 1.2s 2;
}
@media (prefers-reduced-motion: reduce) {
    .celebration-card,
    .celebration-check-circle,
    .celebration-check-tick,
    .celebration-headline,
    .celebration-subtext,
    .share-link-reveal,
    .copy-button-pulse {
        animation: none;
        opacity: 1;
        stroke-dashoffset: 0;
    }
}
`;

function buildEmbedCode(style: EmbedStyle, embedUrl: string, shareToken: string): string {
    if (style === 'transparent') {
        return `<iframe src="${embedUrl}?bg=transparent" width="100%" height="800" style="border:none;border-radius:8px;background:transparent;" title="Bookshelf" allowtransparency="true"></iframe>`;
    }
    const iframeId = `bookshelf-${shareToken.slice(0, 8)}`;
    return `<iframe id="${iframeId}" src="${embedUrl}?bg=transparent" width="100%" height="600" style="border:none;border-radius:8px;background:transparent;" title="Bookshelf" allowtransparency="true"></iframe>
<script>
(function(){
  var f=document.getElementById('${iframeId}');
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='bookshelf-height'&&e.source===f.contentWindow){
      f.style.height=e.data.height+'px';
    }
  });
})();
</script>`;
}

export function ShareModal({ isOpen, onClose, shareToken, isPublic = false, onPublishToggle, onCopy }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('link');
    const [embedStyle, setEmbedStyle] = useState<EmbedStyle>('auto');
    const [isPublishing, setIsPublishing] = useState(false);
    const [justPublished, setJustPublished] = useState(false);
    const prevIsPublicRef = useRef(isPublic);
    const { showToast } = useToast();

    useEffect(() => {
        if (!prevIsPublicRef.current && isPublic) {
            setJustPublished(true);
            setActiveTab('link');
            const timer = setTimeout(() => setJustPublished(false), 4000);
            prevIsPublicRef.current = isPublic;
            return () => clearTimeout(timer);
        }
        prevIsPublicRef.current = isPublic;
    }, [isPublic]);

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareToken}`;
    const embedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${shareToken}`;
    const embedCode = buildEmbedCode(embedStyle, embedUrl, shareToken);

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
            <style>{shareModalCelebrationStyles}</style>
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">Share Your Shelf</h2>

                {/* Publish Status */}
                <div className="mb-4">
                    {justPublished ? (
                        <div className="celebration-card mb-4 px-4 py-6 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center text-center">
                            <svg viewBox="0 0 52 52" className="celebration-check w-14 h-14 mb-3" aria-hidden="true">
                                <circle
                                    cx="26"
                                    cy="26"
                                    r="24"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    className="celebration-check-circle"
                                />
                                <path
                                    d="M14 27 L23 36 L39 18"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="celebration-check-tick"
                                />
                            </svg>
                            <h3 className="celebration-headline text-base font-semibold text-gray-900">
                                Your shelf is live
                            </h3>
                            <p className="celebration-subtext text-sm text-gray-600 mt-1">
                                Share the link below with anyone.
                            </p>
                        </div>
                    ) : isPublic ? (
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

                    {onPublishToggle && !justPublished && (
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

                        <div className={`mb-4 ${justPublished ? 'share-link-reveal' : ''}`}>
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
                                        } ${justPublished && !copied ? 'copy-button-pulse' : ''}`}
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
                            <label htmlFor="embed-style" className="block text-sm font-medium text-gray-700 mb-2">
                                Embed Style
                            </label>
                            <select
                                id="embed-style"
                                value={embedStyle}
                                onChange={(e) => setEmbedStyle(e.target.value as EmbedStyle)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                                {(Object.keys(EMBED_STYLE_LABELS) as EmbedStyle[]).map((style) => (
                                    <option key={style} value={style}>
                                        {EMBED_STYLE_LABELS[style]}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-gray-500">
                                {EMBED_STYLE_DESCRIPTIONS[embedStyle]}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Embed Code
                            </label>
                            <textarea
                                value={embedCode}
                                readOnly
                                rows={embedStyle === 'auto' ? 11 : 4}
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
