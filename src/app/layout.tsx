import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title:       'VidAI Studio - Sang tao video AI',
  description: 'Tao video AI chuyen nghiep: Motion Copy, Image to Video, thay doi trang phuc voi AI',
  keywords:    'AI video, motion copy, image to video, thay trang phuc AI, Vietnam',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0f0f14" />
      </head>
      <body className="min-h-screen bg-surface">
        <Navigation />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
