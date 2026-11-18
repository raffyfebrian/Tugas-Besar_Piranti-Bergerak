import { useLayoutEffect } from 'react';

/**
 * Munculkan elemen bertanda `data-reveal` di halaman publik saat masuk viewport.
 *
 * Kelas `reveal-root` hanya dipasang setelah IntersectionObserver siap, sehingga
 * konten tidak pernah hilang bila JS gagal atau browser tidak mendukungnya.
 * Reduce motion langsung menampilkan semua elemen tanpa animasi.
 *
 * @param key ubah nilai ini saat daftar yang direveal berganti (mis. filter menu).
 */
export const useScrollReveal = (key?: string | number): void => {
  useLayoutEffect(() => {
    const root = document.getElementById('public-content');
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!items.length) return;

    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    root.classList.add('reveal-root');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { root, rootMargin: '0px 0px -32px 0px', threshold: 0.08 },
    );

    items.forEach((element) => observer.observe(element));

    // Pengaman: tab yang tidak dirender (mis. automation/background) bisa menahan
    // callback observer. Pastikan konten yang sudah terlihat tetap muncul.
    const fallback = window.setTimeout(() => {
      items.forEach((element) => {
        if (element.classList.contains('is-visible')) return;
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 24 && rect.bottom > 0) {
          element.classList.add('is-visible');
          observer.unobserve(element);
        }
      });
    }, 900);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
      root.classList.remove('reveal-root');
    };
  }, [key]);
};
