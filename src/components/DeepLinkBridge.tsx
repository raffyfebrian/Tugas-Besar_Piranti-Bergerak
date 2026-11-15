import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { deepLinkToPath } from '../utils/deepLink';

/**
 * Meneruskan deep link kamar (ngoffe://order?room=204) ke router Ionic.
 * Dipasang di dalam IonReactRouter, tetapi tidak merender apa pun.
 */
const DeepLinkBridge: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let removeListener: (() => void) | null = null;

    const open = (url?: string) => {
      const path = deepLinkToPath(url);
      if (path) navigate(path);
    };

    // Aplikasi dibuka dari kondisi mati lewat QR.
    void App.getLaunchUrl()
      .then((result) => {
        if (!disposed && result?.url) open(result.url);
      })
      .catch(() => undefined);

    // Aplikasi sudah berjalan lalu QR dipindai lagi.
    App.addListener('appUrlOpen', ({ url }) => open(url))
      .then((handle) => {
        const remove = () => void handle.remove();
        // React StrictMode memasang efek dua kali; jangan tinggalkan listener yatim.
        if (disposed) {
          remove();
          return;
        }
        removeListener = remove;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      removeListener?.();
      removeListener = null;
    };
  }, [navigate]);

  return null;
};

export default DeepLinkBridge;
