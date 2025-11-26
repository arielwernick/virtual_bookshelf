import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Virtual Bookshelf
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
            >
              Get Started
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-medium text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="how-it-works" className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Books</h3>
            <p className="text-gray-600">
              Showcase your reading list with cover art and personal notes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Podcasts</h3>
            <p className="text-gray-600">
              Share your favorite podcasts and why you love them.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Music</h3>
            <p className="text-gray-600">
              Display your music taste with album artwork from Spotify.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Create your shelf</h4>
                <p className="text-gray-600">Choose a unique username for your bookshelf URL</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Add your favorites</h4>
                <p className="text-gray-600">Search for books, podcasts, and music or add them manually</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share your shelf</h4>
                <p className="text-gray-600">Get a shareable link to embed on your website or share on social media</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block px-12 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
          >
            Get Started - It's Free
          </Link>
        </div>
      </div>
    </div>
  );
}
