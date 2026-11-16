import { IonContent, IonPage } from '@ionic/react';
import React from 'react';

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Balok abu-abu dengan kilau shimmer untuk menandai konten yang sedang dimuat. */
export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className, style }) => (
  <span className={`skeleton${className ? ` ${className}` : ''}`} style={style} aria-hidden="true" />
);

/** Grid kartu menu tiruan untuk fallback saat chunk halaman menu dimuat. */
export const MenuGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="menu-grid menu-skeleton" role="status" aria-label="Memuat menu">
    {Array.from({ length: count }, (_, index) => (
      <div className="menu-skeleton-card" key={index}>
        <SkeletonBlock className="skeleton-thumb" />
        <SkeletonBlock className="skeleton-line skeleton-line-kicker" />
        <SkeletonBlock className="skeleton-line" />
        <SkeletonBlock className="skeleton-line skeleton-line-price" />
      </div>
    ))}
  </div>
);

/** Placeholder section 3D agar beranda tidak "melompat" saat Showcase3D dimuat. */
export const ShowcaseSkeleton: React.FC = () => (
  <section className="showcase3d showcase3d-skeleton" aria-hidden="true">
    <div className="container showcase3d-inner">
      <div className="showcase3d-copy">
        <SkeletonBlock className="skeleton-line skeleton-line-kicker" />
        <SkeletonBlock className="skeleton-line skeleton-line-title" />
        <SkeletonBlock className="skeleton-line skeleton-line-title skeleton-line-short" />
        <SkeletonBlock className="skeleton-line" />
        <SkeletonBlock className="skeleton-line skeleton-line-short" />
      </div>
      <div className="showcase3d-visual">
        <div className="showcase-stage skeleton-stage">
          <SkeletonBlock className="skeleton-card" />
        </div>
      </div>
    </div>
  </section>
);

/** Kerangka halaman staf/admin saat kode halaman sedang diunduh. */
export const PageSkeleton: React.FC = () => (
  <IonPage>
    <IonContent>
      <div className="container page-skeleton" role="status" aria-label="Memuat halaman">
        <SkeletonBlock className="skeleton-line skeleton-line-kicker" />
        <SkeletonBlock className="skeleton-line skeleton-line-title skeleton-line-short" />
        <div className="skeleton-kpis">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBlock className="skeleton-kpi" key={index} />
          ))}
        </div>
        <SkeletonBlock className="skeleton-panel" />
        <SkeletonBlock className="skeleton-panel skeleton-panel-short" />
      </div>
    </IonContent>
  </IonPage>
);
