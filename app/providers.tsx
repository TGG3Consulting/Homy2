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
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        // User is authenticated - connect socket
        console.log('[SocketInitializer] Auth confirmed, connecting socket');
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

    // Try to connect immediately
    socketClient.connect();

    // Start polling for auth status (handles post-login connection)
    authCheckIntervalRef.current = setInterval(checkAuthAndConnect, 2000);

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
