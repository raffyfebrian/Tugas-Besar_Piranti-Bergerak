import { useEffect, useRef, useState } from 'react';

interface WakeLockState {
  supported: boolean;
  active: boolean;
}

/**
 * Menahan layar tetap menyala memakai Screen Wake Lock API.
 * Browser melepas lock otomatis saat tab tersembunyi, jadi lock diminta ulang
 * ketika halaman kembali terlihat. Aman dipakai di web maupun WebView native.
 */
export const useWakeLock = (enabled: boolean): WakeLockState => {
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator && Boolean(navigator.wakeLock),
  );
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !supported) {
      return undefined;
    }

    let disposed = false;

    const release = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => undefined);
      }
    };

    const request = async () => {
      if (disposed) return;
      const existing = sentinelRef.current;
      if (existing && !existing.released) return;

      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (disposed) {
          void sentinel.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = sentinel;
        setActive(true);
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null;
          if (!disposed) setActive(false);
        });
      } catch {
        if (!disposed) setActive(false);
      }
    };

    void request();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [enabled, supported]);

  return { supported, active: enabled && active };
};
