import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
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
  description: "Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.",
  keywords: ["bookshelf", "books", "podcasts", "music", "recommendations", "share", "curate"],
  authors: [{ name: "Virtual Bookshelf" }],
  openGraph: {
    title: "Virtual Bookshelf",
    description: "Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.",
    type: "website",
    siteName: "Virtual Bookshelf",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Bookshelf",
    description: "Curate and share your favorite books, podcasts, and music in a beautiful digital bookshelf.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
