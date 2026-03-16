import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import { LibraryHydrator } from '@/components/app/library-hydrator';
import { PlayerBar } from '@/components/player/player-bar';
import './globals.css';

const bodyFont = IBM_Plex_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const displayFont = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FreeVibes 2.0',
  description:
    'Plataforma full-stack de streaming musical inspirada en la identidad original de FreeVibes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <LibraryHydrator />
        {children}
        <PlayerBar />
      </body>
    </html>
  );
}
