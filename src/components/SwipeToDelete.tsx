import { IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import React, { useRef, useState } from 'react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  flipKey?: string;
}

const THRESHOLD = 72;
const MAX_OFFSET = 120;

/** Baris yang bisa digeser ke kiri untuk dihapus. Tetap bekerja dengan mouse di browser. */
export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({ onDelete, children, flipKey }) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement;
    // Biarkan tombol, stepper, dan textarea tetap bisa dipakai tanpa menggeser baris.
    if (target.closest('button, ion-button, input, textarea')) return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    locked.current = false;
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer sintetis (test) tidak punya pointer aktif; geseran tetap jalan.
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Scroll vertikal menang, geseran dibatalkan.
        setDragging(false);
        setOffset(0);
        return;
      }
      locked.current = true;
    }
    setOffset(Math.max(-MAX_OFFSET, Math.min(0, dx)));
  };

  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Abaikan bila pointer sudah dilepas browser.
    }

    if (offset > -THRESHOLD) {
      setOffset(0);
      return;
    }

    const element = rowRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!element || typeof element.animate !== 'function' || reduced) {
      onDelete();
      return;
    }

    const distance = element.offsetWidth || MAX_OFFSET;
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      onDelete();
    };

    element
      .animate(
        [
          { transform: `translateX(${offset}px)`, opacity: 1 },
          { transform: `translateX(-${distance}px)`, opacity: 0 },
        ],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      )
      .finished.then(commit, commit);
    // Tab yang tidak aktif bisa menahan animation frame; timer memastikan tetap terhapus.
    window.setTimeout(commit, 240);
  };

  return (
    <div className={`swipe-row${dragging ? ' dragging' : ''}`} data-flip-key={flipKey}>
      <div className="swipe-bg" style={{ opacity: Math.min(1, Math.abs(offset) / THRESHOLD) }} aria-hidden="true">
        <IonIcon icon={trashOutline} />
      </div>
      <div
        ref={rowRef}
        className="swipe-front"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {children}
      </div>
    </div>
  );
};
