'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validate returnTo parameter for security
  const getValidatedReturnUrl = (url: string | null): string => {
    if (!url) return '/dashboard';
    
    // Only allow internal URLs (prevent open redirect)
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin === window.location.origin) {
        return parsed.pathname + parsed.search;
      }
    } catch {
      // Invalid URL, fall back to dashboard
    }
    
    return '/dashboard';
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    
    // Include returnTo in Google OAuth flow
    let googleAuthUrl = '/api/auth/google';
    if (returnTo) {
      const encodedReturnTo = encodeURIComponent(returnTo);
      googleAuthUrl += `?returnTo=${encodedReturnTo}`;
    }
    
    // Redirect to Google OAuth flow
    window.location.href = googleAuthUrl;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.username.trim() || !formData.password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Success - redirect to return URL or dashboard
      const redirectUrl = getValidatedReturnUrl(returnTo);
      router.push(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Virtual Bookshelf
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8">
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-gray-900 dark:text-gray-100"
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">or sign in with username</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your username"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link 
            href={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup'} 
            className="text-gray-900 dark:text-gray-100 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
