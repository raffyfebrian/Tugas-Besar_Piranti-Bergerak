import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import type { Order } from '../types';

import { statusLabel } from './format';

const STORAGE_KEY = 'ngoffe-notify-enabled';
const CHANNEL_ID = 'ngoffe-status';

let channelReady = false;

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** Notifikasi sistem tersedia di APK (plugin lokal) maupun browser yang mendukung Web Notifications. */
export const notificationsSupported = (): boolean =>
  Capacitor.isNativePlatform() || (typeof window !== 'undefined' && 'Notification' in window);

export const isNotificationEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const setNotificationEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Mode privat bisa menolak penulisan; fitur notifikasi tetap berjalan selama sesi ini.
  }
};

const mapNativePermission = (display: string): NotificationPermissionState => {
  if (display === 'granted') return 'granted';
  if (display === 'denied') return 'denied';
  return 'prompt';
};

export const notificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!notificationsSupported()) return 'unsupported';
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return mapNativePermission(status.display);
    }
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!notificationsSupported()) return 'unsupported';
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      return mapNativePermission(status.display);
    }
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unsupported';
  }
};

/** ID stabil per perubahan status agar notifikasi Android menimpa yang lama, bukan menumpuk. */
export const notificationId = (order: Order): number => {
  const seed = `${order.id}:${order.timeline.length}`;
  let hash = 7;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2000000000;
  }
  return hash || 1;
};

const ensureChannel = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || channelReady) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Status pesanan',
      description: 'Pemberitahuan saat pesanan Ngoffe ID berubah status.',
      importance: 4,
      visibility: 1,
      vibration: true,
    });
    channelReady = true;
  } catch {
    // Kanal biasanya sudah dibuat pada pemanggilan pertama; aman diabaikan.
  }
};

/**
 * Menampilkan notifikasi perubahan status. Di native memakai plugin lokal supaya
 * tetap muncul saat aplikasi di latar belakang; di web memakai Notification API
 * dan hanya saat tab tidak terlihat.
 */
export const showStatusNotification = async (order: Order): Promise<boolean> => {
  if (!isNotificationEnabled()) return false;
  const permission = await notificationPermission();
  if (permission !== 'granted') return false;

  const title = `Pesanan ${order.code}`;
  const body = `${statusLabel[order.status]}${order.room ? ` • Kamar ${order.room}` : ''}`;

  try {
    if (Capacitor.isNativePlatform()) {
      await ensureChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId(order),
            title,
            body,
            channelId: CHANNEL_ID,
          },
        ],
      });
      return true;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') return false;
    new Notification(title, { body, icon: '/icon-192.png', tag: order.code });
    return true;
  } catch {
    return false;
  }
};
