import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  showValue?: boolean;
  label?: string;
}

const STARS = [1, 2, 3, 4, 5];

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'md', count, showValue, label }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const rounded = Math.round(value);

  return (
    <div className={`star-rating ${size}${onChange ? ' interactive' : ''}`}>
      {onChange ? (
        <div className="star-row" role="radiogroup" aria-label={label ?? 'Rating pesanan'}>
          {STARS.map((starValue) => (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === value}
              aria-label={`Beri ${starValue} bintang`}
              className={starValue <= active ? 'on' : ''}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(starValue)}
              onBlur={() => setHover(0)}
            >
              <IonIcon icon={starValue <= active ? star : starOutline} />
            </button>
          ))}
        </div>
      ) : (
        <span className="star-row" role="img" aria-label={`Rating ${value} dari 5`}>
          {STARS.map((starValue) => (
            <IonIcon
              key={starValue}
              className={starValue <= rounded ? 'on' : ''}
              icon={starValue <= rounded ? star : starOutline}
            />
          ))}
        </span>
      )}
      {showValue && <strong className="star-value">{value ? value.toFixed(1) : '—'}</strong>}
      {count != null && <span className="star-count">({count})</span>}
    </div>
  );
};
