import React from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#1f5c45', '#3f8f5f', '#8fc4a4', '#e2b53c', '#d97757', '#f3e2c7'];

/**
 * Hujan konfeti ringan tanpa dependency. Dipakai sekali saat tamu mengirim
 * ulasan atau menyelesaikan momen penting lain agar terasa seperti aplikasi.
 */
export const Confetti: React.FC<{ pieces?: number }> = ({ pieces = 30 }) =>
  createPortal(
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: pieces }).map((_, index) => (
        <span
          key={index}
          style={
            {
              left: `${(index * 37 + 7) % 100}%`,
              animationDelay: `${(index % 8) * 0.07}s`,
              animationDuration: `${1.7 + ((index * 13) % 8) / 10}s`,
              background: COLORS[index % COLORS.length],
              '--drift': `${((index % 5) - 2) * 26}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
