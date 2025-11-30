'use client';

import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`border-t border-gray-200 bg-white/50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors">
              Virtual Bookshelf
            </Link>
          </div>
          
          {/* Tech stack */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Built with</span>
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Neon
            </a>
            <span>+</span>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Next.js
            </a>
            <span>+</span>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Vercel
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
