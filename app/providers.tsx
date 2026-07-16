'use client'

import { useEffect, useRef, useCallback } from 'react'
import { I18nProvider } from '@/lib/i18n'
import { CompareProvider } from '@/lib/contexts/CompareContext'
import CompareBar from '@/components/CompareBar'
import { socketClient } from '@/lib/socketClient'
import { ThemeProvider } from '@/components/homy/ThemeProvider'

function SocketInitializer() {
  const initializedRef = useRef(false);
  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckCountRef = useRef(0);
  const maxAuthChecks = 10;

  // Check auth status and connect socket if authenticated
  const checkAuthAndConnect = useCallback(async () => {
    // Already connected - stop checking
    if (socketClient.connected) {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
      return;
    }

    authCheckCountRef.current++;

    // Max attempts reached - stop checking
    if (authCheckCountRef.current > maxAuthChecks) {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
      return;
    }

    try {
      // Soft session check (always 200) — no 401 noise for logged-out visitors.
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json().catch(() => ({ authenticated: false }));
      if (data.authenticated) {
        // User is authenticated - connect socket
        socketClient.connect();

        // Stop checking after successful connect attempt
        if (authCheckIntervalRef.current) {
          clearInterval(authCheckIntervalRef.current);
          authCheckIntervalRef.current = null;
        }
      }
    } catch (err) {
      // Silently ignore - will retry
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect the socket only after auth is confirmed (avoids the endless
    // "[SocketClient] Unauthorized: No token provided" spam for logged-out visitors).
    // Single check on mount — login is a full-page navigation, so a later login
    // remounts this component and re-checks; no polling needed (that spammed 401s).
    checkAuthAndConnect();

    // Listen for socket connection changes
    const unsubConnection = socketClient.onConnectionChange((connected) => {
      if (connected && authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
    });

    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      unsubConnection();
      socketClient.disconnect();
    };
  }, [checkAuthAndConnect]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <CompareProvider>
          <SocketInitializer />
          {children}
          <CompareBar />
        </CompareProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
