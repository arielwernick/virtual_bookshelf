'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type ItemType = 'book' | 'podcast' | 'music';

interface FormData {
  title: string;
  creator: string;
  type: ItemType;
  image_url: string;
  external_url: string;
  notes: string;
}

export default function AddItemPage() {
  const params = useParams();
  const router = useRouter();
  const shelfId = params?.shelfId as string;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    creator: '',
    type: 'book',
    image_url: '',
    external_url: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shelfName, setShelfName] = useState('');
  const [loadingShelf, setLoadingShelf] = useState(true);

  // Fetch shelf name for header
  useEffect(() => {
    const fetchShelf = async () => {
      try {
        const res = await fetch(`/api/shelf/${shelfId}`);
        if (res.ok) {
          const data = await res.json();
          setShelfName(data.data.name);
        }
      } catch (err) {
        console.error('Failed to load shelf:', err);
      } finally {
        setLoadingShelf(false);
      }
    };

    if (shelfId) {
      fetchShelf();
    }
  }, [shelfId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.creator.trim()) {
      setError('Creator/Author is required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelf_id: shelfId,
          type: formData.type,
          title: formData.title.trim(),
          creator: formData.creator.trim(),
          image_url: formData.image_url.trim() || null,
          external_url: formData.external_url.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to add item');
        setLoading(false);
        return;
      }

      // Redirect back to shelf
      router.push(`/shelf/${shelfId}`);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (loadingShelf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading shelf...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/shelf/${shelfId}`} className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add Item to "{shelfName}"</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Item Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="book">📚 Book</option>
                <option value="podcast">🎙️ Podcast</option>
                <option value="music">🎵 Music</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                maxLength={255}
                placeholder={`e.g., ${formData.type === 'book' ? 'The Great Gatsby' : formData.type === 'podcast' ? 'Serial Podcast' : 'Abbey Road'}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            {/* Creator */}
            <div>
              <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'book' ? 'Author' : formData.type === 'podcast' ? 'Creator' : 'Artist'} *
              </label>
              <input
                type="text"
                id="creator"
                name="creator"
                value={formData.creator}
                onChange={handleChange}
                disabled={loading}
                maxLength={255}
                placeholder={`e.g., ${formData.type === 'book' ? 'F. Scott Fitzgerald' : formData.type === 'podcast' ? 'Sarah Koenig' : 'The Beatles'}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (optional)
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Link to book cover, podcast art, or album art</p>
            </div>

            {/* External URL */}
            <div>
              <label htmlFor="external_url" className="block text-sm font-medium text-gray-700 mb-2">
                External Link (optional)
              </label>
              <input
                type="url"
                id="external_url"
                name="external_url"
                value={formData.external_url}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to {formData.type === 'book' ? 'Google Books' : formData.type === 'podcast' ? 'podcast app' : 'Spotify'} or other source
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                maxLength={2000}
                placeholder="Your thoughts, rating, or why you recommend this..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/2000</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.creator.trim()}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
              <Link
                href={`/shelf/${shelfId}`}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Title and creator are required</li>
            <li>• Image URLs work best with direct links to images</li>
            <li>• Notes support up to 2000 characters</li>
            <li>• You can edit items after adding them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
