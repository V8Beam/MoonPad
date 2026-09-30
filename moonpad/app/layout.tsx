import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
title: 'MoonPad — Solana Token Launch & Trading',
description: 'MoonPad — a Solana token launch and trading platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
