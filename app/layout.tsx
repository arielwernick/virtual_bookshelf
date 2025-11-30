import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Virtual Bookshelf",
  description: "Create beautiful shelves to share your favorite books, podcasts, and music",
  keywords: ["bookshelf", "books", "podcasts", "music", "recommendations", "share", "curate"],
  authors: [{ name: "Virtual Bookshelf" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.vercel.app'),
  openGraph: {
    title: "Virtual Bookshelf",
    description: "Create beautiful shelves to share your favorite books, podcasts, and music",
    type: "website",
    siteName: "Virtual Bookshelf",
    locale: "en_US",
    url: "/",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Virtual Bookshelf - Share your favorite books, podcasts, and music",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Bookshelf",
    description: "Create beautiful shelves to share your favorite books, podcasts, and music",
    images: ["/api/og"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
