import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.vercel.app';

export const metadata: Metadata = {
  title: "Virtual Bookshelf",
  description: "Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.",
  keywords: ["bookshelf", "books", "podcasts", "music", "recommendations", "share", "curate"],
  authors: [{ name: "Virtual Bookshelf" }],
  openGraph: {
    title: "Virtual Bookshelf - Your bookshelf, everywhere you are",
    description: "Curate your favorite books, podcasts, and music. Share a link anywhere.",
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
    title: "Virtual Bookshelf - Your bookshelf, everywhere you are",
    description: "Curate your favorite books, podcasts, and music. Share a link anywhere.",
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
        <Providers>
          <Navigation />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
