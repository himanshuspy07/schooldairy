import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';

export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'School Diary',
  description: 'Mobile-first offline student diary for tracking attendance, fees, and exam marks.',
  applicationName: 'School Diary',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SchoolDiary',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'School Diary',
    description: 'Mobile-first offline student diary for tracking attendance, fees, and exam marks.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'School Diary',
    description: 'Mobile-first offline student diary for tracking attendance, fees, and exam marks.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#FAF7F2] text-[#1C1917]">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-[#FAF7F2] text-[#1C1917] min-h-screen antialiased selection:bg-[#C8E6C9] selection:text-[#144626]">
        {children}
        {/* Register Service Worker */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then((reg) => {
                  console.log('School Diary Service Worker registered:', reg.scope);
                }).catch((err) => {
                  console.log('Service Worker registration failed:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
