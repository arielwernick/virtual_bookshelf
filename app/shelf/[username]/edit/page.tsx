'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShelfGrid } from '@/components/shelf/ShelfGrid';
import { AddItemForm } from '@/components/shelf/AddItemForm';
import { Modal } from '@/components/ui/Modal';
import { Item } from '@/lib/types/shelf';
import Link from 'next/link';

const MAX_DESCRIPTION_LENGTH = 500;

export default function EditShelfPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [shelfData, setShelfData] = useState<{ username: string; description: string | null; items: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [descriptionSaving, setDescriptionSaving] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Password</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password for {username}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Unlock Shelf
              </button>
            </form>
            <Link
              href={`/shelf/${username}`}
              className="block mt-4 text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Back to public view
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Editing {shelfData?.username}'s Bookshelf
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {shelfData?.items.length || 0} items
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/shelf/${username}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                View Public Shelf
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description Editor */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelf Description</h2>
          <div className="space-y-3">
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Add a description for your shelf..."
              maxLength={MAX_DESCRIPTION_LENGTH}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {description.length}/{MAX_DESCRIPTION_LENGTH} characters
              </span>
              {descriptionDirty && (
                <button
                  onClick={handleSaveDescription}
                  disabled={descriptionSaving}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
                >
                  {descriptionSaving ? 'Saving...' : 'Save Description'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add Item Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
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
