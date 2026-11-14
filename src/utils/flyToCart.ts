const CART_TARGET = '[data-cart-target]';
const GHOST_SIZE = 26;

/**
 * Animasi mikro "terbang ke keranjang": elemen kecil melengkung dari tombol
 * tambah menuju ikon keranjang, lalu keranjang bergoyang sekali.
 * Tidak berjalan bila pengguna meminta animasi dikurangi.
 */
export const flyToCart = (origin: HTMLElement | null): void => {
  if (typeof window === 'undefined') return;
  if (!origin) return;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const target = document.querySelector<HTMLElement>(CART_TARGET);
  if (!target) return;

  const start = origin.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const originX = start.left + start.width / 2;
  const originY = start.top + start.height / 2;
  const deltaX = end.left + end.width / 2 - originX;
  const deltaY = end.top + end.height / 2 - originY;

  const ghost = document.createElement('span');
  ghost.className = 'fly-ghost';
  ghost.textContent = '☕';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.left = `${originX - GHOST_SIZE / 2}px`;
  ghost.style.top = `${originY - GHOST_SIZE / 2}px`;
  document.body.appendChild(ghost);

  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${deltaX * 0.55}px, ${deltaY * 0.55 - 58}px) scale(0.92)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );

  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
  // Bila frame tidak pernah berjalan (mis. tab tersembunyi), buang elemen supaya tidak menumpuk.
  window.setTimeout(() => ghost.remove(), 1000);

  target.classList.remove('cart-bump');
  void target.offsetWidth; // paksa reflow agar animasi bisa diulang
  target.classList.add('cart-bump');
  window.setTimeout(() => target.classList.remove('cart-bump'), 480);
};
