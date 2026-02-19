import { useEffect, useRef } from 'react';

/**
 * Manages the Screen Wake Lock API to keep the screen on during audio playback.
 * Automatically acquires the lock when active, releases when inactive,
 * and re-acquires after visibility changes (browser releases it when tab is hidden).
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const acquire = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // Can fail (e.g. low battery, background tab)
        }
      }
    };

    const release = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore release errors
        }
        wakeLockRef.current = null;
      }
    };

    if (active) {
      void acquire();
    } else {
      void release();
    }

    return () => {
      void release();
    };
  }, [active]);

  // Re-acquire when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLockRef.current = lock;
        }).catch(() => {
          // Best effort
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active]);
}
