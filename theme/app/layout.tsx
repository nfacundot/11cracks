import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Goalify — Football Live',
  description: 'Mobile football dashboard inspired by the Goalify concept.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
