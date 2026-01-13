'use client';

interface LinkUrlFormProps {
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  onSubmit: () => void;
  fetching: boolean;
  quotaExceeded?: boolean;
}

export function LinkUrlForm({
  linkUrl,
  setLinkUrl,
  onSubmit,
  fetching,
  quotaExceeded = false,
}: LinkUrlFormProps) {
  if (quotaExceeded) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Link preview service is temporarily unavailable. You can still add links manually using the &quot;Or add manually&quot; option.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Paste any URL (e.g., https://nytimes.com/article...)"
          className="flex-1 px-4 py-2 border border-orange-300 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          onClick={onSubmit}
          disabled={fetching || !linkUrl.trim()}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
        >
          {fetching ? 'Fetching...' : 'Add Link'}
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Works with articles, blog posts, and most web pages. Title and preview image will be extracted automatically.
      </p>
    </div>
  );
}
