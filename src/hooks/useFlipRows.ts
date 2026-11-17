import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * FLIP: simpan posisi baris sebelum perubahan daftar, lalu setelah commit
 * geser baris yang masih ada dari posisi lama ke posisi barunya.
 *
 * Pemakaian: panggil `capture()` tepat sebelum mengubah state, lalu beri
 * `data-flip-key` pada setiap baris di dalam `rootRef`.
 */
export const useFlipRows = (rootRef: RefObject<HTMLElement | null>): (() => void) => {
  const before = useRef<Map<string, DOMRect>>(new Map());

  const capture = (): void => {
    const rects = new Map<string, DOMRect>();
    rootRef.current?.querySelectorAll<HTMLElement>('[data-flip-key]').forEach((element) => {
      const key = element.dataset.flipKey;
      if (key) rects.set(key, element.getBoundingClientRect());
    });
    before.current = rects;
  };

  useLayoutEffect(() => {
    const previous = before.current;
    if (!previous.size) return;
    before.current = new Map();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    rootRef.current?.querySelectorAll<HTMLElement>('[data-flip-key]').forEach((element) => {
      const key = element.dataset.flipKey;
      const oldRect = key ? previous.get(key) : undefined;
      if (!oldRect || typeof element.animate !== 'function') return;

      const newRect = element.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 320,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    });
  });

  return capture;
};
