'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Analytics with SSR disabled to prevent hydration errors
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then((mod) => mod.Analytics),
  { ssr: false }
);

/**
 * Analytics Provider Component
 * Client component wrapper for Vercel Analytics
 * Prevents hydration errors by only rendering after mount
 */
export function AnalyticsProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Analytics during SSR or initial render
  if (!mounted) {
    return null;
  }

  return <Analytics />;
}

