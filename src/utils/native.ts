import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

/** True hanya saat berjalan di dalam APK/WebView native, bukan di browser. */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** Getaran halus untuk aksi ringan: tambah keranjang, ubah jumlah. */
export const tapFeedback = async (style: ImpactStyle = ImpactStyle.Light): Promise<void> => {
  if (!isNativeApp()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Sebagian perangkat/emulator tidak punya motor getar.
  }
};

/** Getaran konfirmasi untuk aksi penting: pesanan dibuat, pembayaran divalidasi. */
export const successFeedback = async (): Promise<void> => {
  if (!isNativeApp()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics tidak tersedia di platform ini.
  }
};

const VISIBLE_OVERLAY =
  'ion-modal.overlay-visible, ion-alert.overlay-visible, ion-action-sheet.overlay-visible, ion-popover.overlay-visible';

/** Tutup overlay Ionic teratas (modal/alert) saat tombol back Android ditekan. */
const dismissTopOverlay = (): boolean => {
  const overlays = Array.from(document.querySelectorAll<HTMLElement>(VISIBLE_OVERLAY));
  const top = overlays[overlays.length - 1];
  if (!top) return false;
  const dismiss = (top as HTMLElement & { dismiss?: () => Promise<boolean> }).dismiss;
  if (typeof dismiss !== 'function') return false;
  void Promise.resolve(dismiss.call(top)).catch(() => undefined);
  return true;
};

/**
 * Menyiapkan perilaku khas aplikasi Android: warna status bar mengikuti tema hijau
 * dan tombol back hardware kembali ke halaman sebelumnya (bukan menutup aplikasi).
 */
export const setupNativeShell = (): (() => void) => {
  if (!isNativeApp()) return () => undefined;

  let disposed = false;
  let removeListener: (() => void) | null = null;

  void (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#1f5c45' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch {
      // StatusBar hanya tersedia di perangkat native.
    }
  })();

  App.addListener('backButton', ({ canGoBack }) => {
    if (dismissTopOverlay()) return;
    if (canGoBack) {
      window.history.back();
      return;
    }
    void App.exitApp();
  })
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
};
