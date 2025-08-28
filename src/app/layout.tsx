import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Book Analyzer',
    template: '%s · Book Analyzer',
  },
  description:
    'Analyze Project Gutenberg books with AI to visualize character relationships, themes, key events, and summaries.',
  keywords: [
    'Book Analyzer',
    'Project Gutenberg',
    'literary analysis',
    'character relationships',
    'D3.js',
    'Next.js',
    'Groq',
    'AI',
  ],
  authors: [{ name: 'Book Analyzer' }],
  creator: 'Book Analyzer',
  applicationName: 'Book Analyzer',
  themeColor: '#4f46e5',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Book Analyzer',
    description:
      'AI-powered analysis and visualization of characters, themes, and events in classic books.',
    url: '/',
    siteName: 'Book Analyzer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Analyzer',
    description:
      'Analyze classic books with AI and visualize character relationships.',
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
        {children}
      </body>
    </html>
  );
}
