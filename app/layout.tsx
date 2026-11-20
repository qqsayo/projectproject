import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/900.css';
import './globals.css';
import { StoreShell } from '@/components/store-shell';

export const metadata: Metadata = {
  title: { default: 'PROJECT 1 — Sneakers in motion', template: '%s — PROJECT 1' },
  description: 'An independent sneaker archive. Explore the silhouettes that shaped running, court and terrace culture.',
  icons: { icon: '/project-1.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><StoreShell>{children}</StoreShell></body></html>;
}


