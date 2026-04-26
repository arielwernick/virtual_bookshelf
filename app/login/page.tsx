'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

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
    <div className="brand-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid lg:grid-cols-5 gap-8 items-center">
        {/* Welcome plane */}
        <div className="lg:col-span-2 order-2 lg:order-1" data-reveal="left">
          <div className="plane plane-ink p-8 sm:p-10 relative overflow-hidden min-h-[380px] flex flex-col justify-between">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-2xl bg-[var(--db-blue)] opacity-90" aria-hidden="true" />
            <div className="absolute -right-6 bottom-8 h-20 w-20 rounded-xl bg-[var(--db-lime)]" aria-hidden="true" />

            <div className="relative">
              <span className="tab-anchor" style={{ background: 'var(--db-lime)', color: 'var(--db-ink)' }}>
                Welcome back
              </span>
              <h2
                className={`${spaceGrotesk.className} mt-5 text-[var(--db-coconut)] font-bold tracking-[-0.035em] leading-[0.92]`}
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
              >
                Pick up
                <br />
                where you
                <br />
                <span className="text-[var(--db-lime)]">left off.</span>
              </h2>
            </div>
            <p className="relative mt-6 max-w-xs text-[var(--db-coconut)]/75 font-medium">
              Your shelves are right where you put them.
            </p>
          </div>
        </div>

        {/* Sign-in plane */}
        <div className="lg:col-span-3 order-1 lg:order-2 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto" data-reveal="soft" data-stagger="2">
          <Link href="/" className={`${spaceGrotesk.className} inline-flex items-center gap-2 text-sm font-semibold text-[var(--db-ink)]/60 hover:text-[var(--db-ink)] mb-6 transition-colors`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back home
          </Link>

          <h1 className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.03em] leading-none mb-2`} style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
            Sign in.
          </h1>
          <p className="text-[var(--db-ink)]/70 font-medium mb-8">Welcome back — let&apos;s get to your shelves.</p>

          <div className="plane plane-paper p-7 sm:p-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 bg-white border border-[var(--db-ink)]/15 rounded-xl hover:border-[var(--db-ink)]/30 hover:shadow-sm transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-[var(--db-ink)]"
            >
              <GoogleIcon className="w-5 h-5" />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--db-ink)]/12"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[var(--db-paper)] text-[var(--db-ink)]/50 font-semibold uppercase tracking-[0.14em]">or username</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-[var(--db-crimson-soft)] border border-[var(--db-crimson)]/30 text-[var(--db-crimson)] px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-xs uppercase tracking-[0.14em] font-bold text-[var(--db-ink)]/70 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="your_username"
                  className="brand-input w-full px-4 py-3 text-[var(--db-ink)] placeholder-[var(--db-ink)]/40"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-[0.14em] font-bold text-[var(--db-ink)]/70 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  className="brand-input w-full px-4 py-3 text-[var(--db-ink)] placeholder-[var(--db-ink)]/40"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="brand-button brand-button-blue w-full py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-sm text-[var(--db-ink)]/70">
            No account yet?{' '}
            <Link
              href={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup'}
              className="text-[var(--db-blue)] font-semibold hover:underline"
            >
              Create one →
            </Link>
          </p>
        </div>
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
