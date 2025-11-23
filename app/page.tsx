'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6" style={{ color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>
            Virtual Bookshelf
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--gray-600)', lineHeight: '1.7' }}>
            Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/create"
              className="px-8 py-3 rounded-full font-semibold text-lg transition-all shadow-md hover:shadow-lg"
              style={{ 
                backgroundColor: 'var(--primary-orange)',
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create Your Shelf
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-3 rounded-full font-semibold text-lg transition-all"
              style={{ 
                border: '2px solid var(--primary-orange)',
                color: 'var(--primary-orange)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="how-it-works" className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white p-8 rounded-xl transition-all hover:shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--primary-orange-100)', color: 'var(--primary-orange)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--gray-900)' }}>Books</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Showcase your reading list with cover art and personal notes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl transition-all hover:shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--primary-orange-100)', color: 'var(--primary-orange)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--gray-900)' }}>Podcasts</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Share your favorite podcasts and why you love them.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl transition-all hover:shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--primary-orange-100)', color: 'var(--primary-orange)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--gray-900)' }}>Music</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Display your music taste with album artwork from Spotify.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl p-10 mb-20" style={{ border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: 'var(--gray-900)' }}>How It Works</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--primary-orange)', color: 'white' }}>
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1" style={{ color: 'var(--gray-900)' }}>Create your shelf</h4>
                <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>Choose a unique username for your bookshelf URL</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--primary-orange)', color: 'white' }}>
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1" style={{ color: 'var(--gray-900)' }}>Add your favorites</h4>
                <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>Search for books, podcasts, and music or add them manually</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--primary-orange)', color: 'white' }}>
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1" style={{ color: 'var(--gray-900)' }}>Share your shelf</h4>
                <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>Get a shareable link to embed on your website or share on social media</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/create"
            className="inline-block px-12 py-4 rounded-full font-semibold text-lg transition-all shadow-md hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--primary-orange)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-orange-dark)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get Started - It's Free
          </Link>
        </div>
      </div>
    </div>
  );
}
