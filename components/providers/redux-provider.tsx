"use client";

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store';

// Global singleton for the client side to survive layout remounts (e.g., locale layer change)
let clientStore: AppStore | undefined;

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  
  if (!storeRef.current) {
    if (typeof window === 'undefined') {
      // Server-side: create a new store for every request
      storeRef.current = makeStore();
    } else {
      // Client-side: use a singleton store to persist state across route/layout parameter changes
      if (!clientStore) {
        clientStore = makeStore();
      }
      storeRef.current = clientStore;
    }
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
