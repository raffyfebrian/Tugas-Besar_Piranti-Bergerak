import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/** Halaman tersembunyi tidak menjalankan requestAnimationFrame, jadi langsung tampilkan nilai akhir. */
const shouldAnimate = (): boolean =>
  !prefersReducedMotion() && (typeof document === 'undefined' || document.visibilityState !== 'hidden');

/** Angka yang bergerak halus menuju nilai terbaru (mis. pendapatan hari ini). */
export const CountUp: React.FC<CountUpProps> = ({ value, format, duration = 750 }) => {
  const reduced = !shouldAnimate();
  const [animated, setAnimated] = useState(() => (reduced ? value : 0));
  const animatedRef = useRef(reduced ? value : 0);

  useEffect(() => {
    if (!shouldAnimate()) {
      animatedRef.current = value;
      return undefined;
    }

    const from = animatedRef.current;
    const delta = value - from;
    if (delta === 0) return undefined;

    let frame = 0;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + delta * eased);
      animatedRef.current = next;
      setAnimated(next);
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    // Jaring pengaman: bila requestAnimationFrame tidak pernah berjalan (mis. WebView
    // yang membatasi frame), angka tetap berakhir di nilai yang benar.
    const settle = window.setTimeout(() => {
      animatedRef.current = value;
      setAnimated(value);
    }, duration + 220);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [value, duration]);

  const display = reduced ? value : animated;

  return <span>{format ? format(display) : display}</span>;
};
