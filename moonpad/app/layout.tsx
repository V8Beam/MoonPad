import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MoonPad — AI Token Platform',
  description: 'MoonPad dashboard prototype for token launches, monitoring, and AI agents.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
