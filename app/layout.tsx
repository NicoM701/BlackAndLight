import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Black & Light',
  description: 'Structure-preserving black and white artistic image translation',
  icons: {
    icon: '/favicon.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
