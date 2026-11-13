import { IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import React from 'react';

import type { MenuItem } from '../types';
import { rupiah } from '../utils/format';

interface MenuCardProps {
  item: MenuItem;
  action?: React.ReactNode;
  onAdd?: () => void;
  compact?: boolean;
  index?: number;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, action, onAdd, compact, index = 0 }) => (
  <article className="menu-card fade-up" style={{ animationDelay: `${Math.min(index, 14) * 45}ms` }}>
    <div className="menu-thumb" style={{ background: item.gradient }}>
      <span className="emoji">{item.emoji}</span>
      {!item.available && <span className="menu-flag">Habis</span>}
    </div>
    <div className="menu-body">
      <span className="menu-cat">{item.category}</span>
      <h3>{item.name}</h3>
      {!compact && <p className="menu-desc">{item.description}</p>}
      <div className="menu-foot">
        <span className="price">{rupiah(item.price)}</span>
        {action ??
          (onAdd && (
            <button
              type="button"
              className="round-add"
              onClick={onAdd}
              disabled={!item.available}
              aria-label={`Tambah ${item.name}`}
            >
              <IonIcon icon={add} />
            </button>
          ))}
      </div>
    </div>
  </article>
);
