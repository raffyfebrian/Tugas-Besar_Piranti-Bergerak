import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useScrollReveal } from './useScrollReveal';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [0];
  targets: Element[] = [];
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const Page = () => {
  useScrollReveal();
  return (
    <div id="public-content">
      <div className="reveal" data-reveal data-testid="first">
        Pertama
      </div>
      <div className="reveal" data-reveal data-testid="second">
        Kedua
      </div>
    </div>
  );
};

const root = () => document.getElementById('public-content');
const first = () => screen.getByTestId('first');
const second = () => screen.getByTestId('second');

const entry = (target: Element, isIntersecting: boolean): IntersectionObserverEntry =>
  ({ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }) as IntersectionObserverEntry;

const setReduceMotion = (matches: boolean) => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query.includes('prefers-reduced-motion') ? matches : false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
};

describe('useScrollReveal', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    setReduceMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('memasang observer dan menandai root sebagai reveal-root', () => {
    render(<Page />);
    expect(root()?.classList.contains('reveal-root')).toBe(true);
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(FakeIntersectionObserver.instances[0].targets).toEqual([first(), second()]);
  });

  test('hanya elemen yang masuk viewport yang diberi is-visible', () => {
    render(<Page />);
    const observer = FakeIntersectionObserver.instances[0];

    observer.callback([entry(first(), true), entry(second(), false)], observer as unknown as IntersectionObserver);

    expect(first().classList.contains('is-visible')).toBe(true);
    expect(second().classList.contains('is-visible')).toBe(false);
    expect(observer.unobserve).toHaveBeenCalledWith(first());
  });

  test('reduce motion menampilkan semua elemen tanpa observer', () => {
    setReduceMotion(true);
    render(<Page />);

    expect(first().classList.contains('is-visible')).toBe(true);
    expect(second().classList.contains('is-visible')).toBe(true);
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(root()?.classList.contains('reveal-root')).toBe(false);
  });

  test('membersihkan observer saat komponen dilepas', () => {
    const { unmount } = render(<Page />);
    const observer = FakeIntersectionObserver.instances[0];
    const element = root();

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
    expect(element?.classList.contains('reveal-root')).toBe(false);
  });
});
