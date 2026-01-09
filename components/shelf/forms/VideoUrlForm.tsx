'use client';

interface VideoUrlFormProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  onSubmit: () => void;
  fetching: boolean;
}

export function VideoUrlForm({
  videoUrl,
  setVideoUrl,
  onSubmit,
  fetching,
}: VideoUrlFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
          className="flex-1 px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          onClick={onSubmit}
          disabled={fetching || !videoUrl.trim()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          {fetching ? 'Fetching...' : 'Add Video'}
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Supported formats: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/shorts/xxx
      </p>
    </div>
  );
}
