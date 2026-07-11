import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mon Budget',
  description: 'Application personnelle de gestion de budget',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Budget' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' }
};
export const viewport: Viewport = { themeColor: '#f7f8fb', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
