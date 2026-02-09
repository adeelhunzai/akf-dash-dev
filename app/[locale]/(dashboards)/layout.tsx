import type React from 'react';
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { AuthInitializer } from '@/components/providers/auth-initializer';
import { SSOHandler } from '@/components/providers/sso-handler';
import { RouteGuard } from '@/components/providers/route-guard';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Learning Hub - Dashboard',
  description: 'Monitor your platform performance and key metrics',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/akf-logo.png',
  },
};

export default function DashboardsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${openSans.variable} font-sans antialiased`}>
      <ReduxProvider>
        <AuthInitializer>
          <SSOHandler>
            <RouteGuard>
              {children}
            </RouteGuard>
          </SSOHandler>
        </AuthInitializer>
      </ReduxProvider>
      <Analytics />
    </div>
  );
}
