import { IonIcon } from '@ionic/react';
import { add, remove } from 'ionicons/icons';
import React, { useMemo } from 'react';

import { tapFeedback } from '../utils/native';

interface FakeQrProps {
  seed: string;
  size?: number;
}

const GRID = 21;

const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const isFinderCell = (row: number, col: number) => {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= GRID - 7;
  const inBottomLeft = row >= GRID - 7 && col < 7;
  if (!inTopLeft && !inTopRight && !inBottomLeft) return null;

  const localRow = inBottomLeft ? row - (GRID - 7) : row;
  const localCol = inTopRight ? col - (GRID - 7) : col;
  const border = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
  const core = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
  return border || core;
};

export const FakeQr: React.FC<FakeQrProps> = ({ seed, size = 210 }) => {
  const cells = useMemo(() => {
    let value = hashSeed(seed) || 1;
    const result: boolean[] = [];
    for (let i = 0; i < GRID * GRID; i += 1) {
      value = (Math.imul(value, 1103515245) + 12345) >>> 0;
      result.push(((value >>> 16) & 1) === 1);
    }
    return result;
  }, [seed]);

  return (
    <div className="fake-qr" style={{ width: size }} aria-label={`QR kamar ${seed}`}>
      {Array.from({ length: GRID * GRID }).map((_, index) => {
        const row = Math.floor(index / GRID);
        const col = index % GRID;
        const finder = isFinderCell(row, col);
        const on = finder === null ? cells[index] : finder;
        return <i key={index} className={on ? 'on' : ''} />;
      })}
    </div>
  );
};

export const QtyStepper: React.FC<{
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  min?: number;
}> = ({ qty, onAdd, onRemove, min = 0 }) => (
  <div className="qty-control">
    <button
      type="button"
      onClick={() => {
        void tapFeedback();
        onRemove();
      }}
      disabled={qty <= min}
      aria-label="Kurangi jumlah"
    >
      <IonIcon icon={remove} />
    </button>
    <span className="qty-value" key={qty} aria-live="polite">
      {qty}
    </span>
    <button
      type="button"
      onClick={() => {
        void tapFeedback();
        onAdd();
      }}
      aria-label="Tambah jumlah"
    >
      <IonIcon icon={add} />
    </button>
  </div>
);
