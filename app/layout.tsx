import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base URL for OG images
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

// Site-wide Organization entity with sameAs profile links, so search and answer
// engines can resolve "Virtual Bookshelf" as a distinct entity (the brand name is
// contested). Rendered on every page from the root layout below.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${baseUrl}/#organization`,
  name: 'Virtual Bookshelf',
  url: baseUrl,
  logo: `${baseUrl}/favicon.svg`,
  description:
    'Curate and share shelves of books, podcasts, music, videos, links, and live stock tickers — all behind one link.',
  sameAs: [
    'https://github.com/arielwernick/virtual_bookshelf',
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Virtual Bookshelf — your books, podcasts & music in one link',
    template: '%s | Virtual Bookshelf',
  },
  description: 'Curate shelves of books, podcasts, music, videos, links — even live stock tickers. Share a single link anywhere.',
  keywords: ['bookshelf', 'books', 'podcasts', 'music', 'videos', 'links', 'stocks', 'curate', 'share', 'reading list', 'watchlist'],
  authors: [{ name: "Virtual Bookshelf" }],
  openGraph: {
    title: 'Virtual Bookshelf — A shelf for everything you love',
    description: 'Curate shelves of books, podcasts, music, videos, links — even live stock tickers. Share a single link anywhere.',
    type: "website",
    siteName: "Virtual Bookshelf",
    locale: "en_US",
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/api/og/landing`,
        width: 1200,
        height: 630,
        alt: "Virtual Bookshelf - Curate and share your favorites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: 'Virtual Bookshelf — A shelf for everything you love',
    description: 'Curate shelves of books, podcasts, music, videos, links — even live stock tickers. Share a single link anywhere.',
    images: [`${baseUrl}/api/og/landing`],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Virtual Bookshelf",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Providers>
          <Navigation />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
