import { IonButton, IonIcon } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, swapHorizontalOutline } from 'ionicons/icons';
import React, { useEffect, useMemo, useRef } from 'react';

import { useApp } from '../store/AppStore';
import { rupiah } from '../utils/format';
import { pickSignatureItems } from '../utils/showcase';

const STEP_DEGREES = 60;
const AUTO_SPEED = 0.0075; // derajat per milidetik
const DRAG_SENSITIVITY = 0.32; // derajat per piksel

/**
 * Karusel menu 3D berbasis CSS transform + requestAnimationFrame.
 * Bisa diputar dengan geser (mouse/sentuh), tombol putar, atau berputar sendiri.
 * Auto-rotate dimatikan saat kursor di atas panggung dan saat pengguna meminta
 * pengurangan gerak.
 */
const Showcase3D: React.FC = () => {
  const { state } = useApp();
  const items = useMemo(() => pickSignatureItems(state.menu, 6), [state.menu]);

  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const lastPointerRef = useRef({ x: 0, time: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    const onChange = () => {
      reducedRef.current = media.matches;
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries.some((entry) => entry.isIntersecting);
      },
      { rootMargin: '120px' },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(48, Math.max(0, now - previous));
      previous = now;
      const ring = ringRef.current;

      if (ring && visibleRef.current) {
        if (!draggingRef.current) {
          if (targetRef.current !== null) {
            const difference = targetRef.current - rotationRef.current;
            rotationRef.current += difference * Math.min(1, delta / 110);
            if (Math.abs(difference) < 0.12) {
              rotationRef.current = targetRef.current;
              targetRef.current = null;
            }
          } else if (Math.abs(velocityRef.current) > 0.0004) {
            rotationRef.current += velocityRef.current * delta;
            velocityRef.current *= Math.pow(0.9, delta / 16.7);
          } else {
            velocityRef.current = 0;
            if (!reducedRef.current && !pausedRef.current) {
              rotationRef.current -= AUTO_SPEED * delta;
            }
          }
        }

        ring.style.transform = `rotateY(${rotationRef.current.toFixed(2)}deg)`;

        const panels = ring.children as HTMLCollectionOf<HTMLElement>;
        for (let index = 0; index < panels.length; index += 1) {
          const angle = (((index * STEP_DEGREES + rotationRef.current) % 360) + 360) % 360;
          const distance = angle > 180 ? 360 - angle : angle;
          const fade = Math.cos((distance / 180) * (Math.PI / 2));
          panels[index].style.opacity = (0.16 + 0.84 * fade).toFixed(3);
        }
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    stageRef.current?.classList.remove('is-dragging');
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    draggingRef.current = true;
    targetRef.current = null;
    velocityRef.current = 0;
    lastPointerRef.current = { x: event.clientX, time: performance.now() };
    stageRef.current?.classList.add('is-dragging');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const elapsed = Math.max(1, now - lastPointerRef.current.time);
    const movement = (event.clientX - lastPointerRef.current.x) * DRAG_SENSITIVITY;
    lastPointerRef.current = { x: event.clientX, time: now };
    rotationRef.current += movement;
    velocityRef.current = Math.max(-0.08, Math.min(0.08, movement / elapsed));
  };

  const spin = (direction: 1 | -1) => {
    const base = targetRef.current ?? rotationRef.current;
    targetRef.current = base + direction * STEP_DEGREES;
    velocityRef.current = 0;
  };

  return (
    <section className="showcase3d" aria-labelledby="showcase3d-title">
      <div className="container showcase3d-inner">
        <div className="showcase3d-copy fade-up">
          <span className="section-kicker">Signature • 360°</span>
          <h2 id="showcase3d-title" className="showcase3d-title">
            Menu yang berputar
            <br />
            <em>di ujung jari.</em>
          </h2>
          <p>
            Setiap cangkir dan piring punya karakter sendiri. Putar panggung 3D ini untuk melihat signature pick dari
            dapur kami — lalu pesan langsung ke kamar.
          </p>
          <div className="showcase3d-chips">
            <span>CSS 3D asli</span>
            <span>Geser untuk memutar</span>
            <span>Tanpa library berat</span>
          </div>
          <div className="showcase3d-actions">
            <IonButton color="light" routerLink="/menu">
              Jelajahi Menu
            </IonButton>
            <IonButton color="light" fill="outline" routerLink="/order">
              Pesan dari Kamar
            </IonButton>
          </div>
        </div>

        <div className="showcase3d-visual">
          <div
            className="showcase-stage"
            ref={stageRef}
            role="group"
            aria-label="Karusel 3D menu signature. Geser atau gunakan tombol putar."
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerEnter={() => {
              pausedRef.current = true;
            }}
            onPointerLeave={() => {
              pausedRef.current = false;
            }}
          >
            <div className="showcase-floor" aria-hidden="true" />
            <div className="showcase-ring" ref={ringRef}>
              {items.map((item, index) => (
                <div
                  className="showcase-panel"
                  key={item.id}
                  style={{ transform: `rotateY(${index * STEP_DEGREES}deg) translateZ(var(--radius))` }}
                >
                  <article className="showcase-card">
                    <div className="showcase-thumb" style={{ background: item.gradient }} aria-hidden="true">
                      {item.emoji}
                    </div>
                    <span className="showcase-cat">{item.category}</span>
                    <h3>{item.name}</h3>
                    <span className="showcase-price">{rupiah(item.price)}</span>
                  </article>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-controls">
            <IonButton
              shape="round"
              fill="outline"
              color="light"
              aria-label="Putar menu ke kiri"
              onClick={() => spin(-1)}
            >
              <IonIcon slot="icon-only" icon={chevronBackOutline} />
            </IonButton>
            <span className="showcase-hint">
              <IonIcon icon={swapHorizontalOutline} />
              Geser untuk memutar
            </span>
            <IonButton
              shape="round"
              fill="outline"
              color="light"
              aria-label="Putar menu ke kanan"
              onClick={() => spin(1)}
            >
              <IonIcon slot="icon-only" icon={chevronForwardOutline} />
            </IonButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase3D;
