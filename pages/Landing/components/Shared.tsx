import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from './hooks';

import Button from '@/components/ui/Button';
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  variant?: 'up' | 'left' | 'right' | 'scale' | 'mask';
  className?: string;
}> = ({ children, delay = 0, variant = 'up', className = '' }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`cq-reveal cq-reveal-${variant} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const SpotlightCursor: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return <div ref={ref} className="cq-spotlight" aria-hidden />;
};

export const Marquee: React.FC<{ items: string[]; reverse?: boolean; bg?: string; color?: string }> = ({
  items,
  reverse,
  bg = '#1A1410',
  color = '#F5D7A8',
}) => {
  const looped = [...items, ...items, ...items];
  return (
    <div className="cq-marquee" style={{ background: bg, color }}>
      <div className={`cq-marquee-track ${reverse ? 'cq-marquee-reverse' : ''}`}>
        {looped.map((t, i) => (
          <span key={i} className="cq-marquee-item">
            <span className="cq-marquee-text">{t}</span>
            <span className="cq-marquee-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export const MagBtn: React.FC<{
  children: React.ReactNode;
  href?: string;
  to?: string;
  variant?: 'gold' | 'ghost' | 'dark';
  className?: string;
}> = ({ children, href, to, variant = 'gold', className = '' }) => {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  };
  const cls = `cq-magbtn cq-magbtn-${variant} ${className}`;
  if (to)
    return (
      <Link
        to={to}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cls}
      >
        <span>{children}</span>
      </Link>
    );
  return (
    <a
      href={href}
      ref={ref as React.RefObject<HTMLAnchorElement>}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cls}
    >
      <span>{children}</span>
    </a>
  );
};

export const Cookie: React.FC<{
  flavor: 'choco' | 'cafe' | 'matcha' | 'redvelvet' | 'tiramisu' | 'lava';
  size?: number;
}> = ({ flavor, size = 110 }) => {
  const palette: Record<string, { base: string; spots: string; rim: string; glaze?: string }> = {
    choco: { base: '#5C3520', spots: '#2A1810', rim: '#3D2414' },
    cafe: { base: '#7A5530', spots: '#4A3018', rim: '#5C3F22' },
    matcha: { base: '#7DA063', spots: '#FFFFFF', rim: '#5E7E47', glaze: '#A8D38C' },
    redvelvet: { base: '#9B2C2C', spots: '#FFFFFF', rim: '#6B1A1A' },
    tiramisu: { base: '#A07857', spots: '#3D2418', rim: '#7A5A3F' },
    lava: { base: '#3D2418', spots: '#1A0E08', rim: '#2A1810', glaze: '#5C3520' },
  };
  const p = palette[flavor];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`g2-${flavor}`} cx="38%" cy="32%">
          <stop offset="0%" stopColor={p.base} />
          <stop offset="55%" stopColor={p.base} />
          <stop offset="100%" stopColor={p.rim} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#g2-${flavor})`} />
      {p.glaze && (
        <path d="M 18 45 Q 30 55, 50 50 Q 70 45, 82 52 L 80 60 Q 60 56, 50 60 Q 35 64, 20 58 Z" fill={p.glaze} opacity="0.85" />
      )}
      {[
        [32, 38, 4],
        [60, 32, 3],
        [68, 58, 3.5],
        [40, 62, 3],
        [55, 72, 2.5],
        [25, 55, 2.5],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={p.spots} opacity="0.82" />
      ))}
      <circle cx="50" cy="50" r="46" fill="none" stroke={p.rim} strokeWidth="2" opacity="0.6" />
    </svg>
  );
};

const COOKIE_PHOTOS: Partial<Record<string, string>> = {
  choco: '/cookies_chocolate.png',
  cafe: '/cookies_cafe.png',
  matcha: '/cookies_matcha.png',
  redvelvet: '/cookies_redverlet.png',
  lava: '/cold_cookies_chocolate.png',
  tiramisu: '/cold_cookies_cafe.png',
  'cold-matcha': '/cold_cookies_matcha.png',
  'cold-redvelvet': '/cold_cookies_redverlet.png',
};

export const CookieMedia: React.FC<{
  flavor: 'choco' | 'cafe' | 'matcha' | 'redvelvet' | 'tiramisu' | 'lava' | 'cold-matcha' | 'cold-redvelvet';
  size?: number;
}> = ({ flavor, size = 110 }) => {
  const photo = COOKIE_PHOTOS[flavor];
  if (photo) {
    return (
      <img
        src={photo}
        alt={`Cookie ${flavor}`}
        className="cq2-photo-cookie"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Cookie flavor={flavor} size={size} />;
};

export const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; onToggle: () => void }> = ({ theme, onToggle }) => (
  <Button
    type="button"
    onClick={onToggle}
    className="cq2-theme-toggle"
    aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
   variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
    <span className={`cq2-theme-track ${theme === 'dark' ? 'is-dark' : ''}`}>
      <span className="cq2-theme-icon cq2-theme-sun" aria-hidden>☀</span>
      <span className="cq2-theme-icon cq2-theme-moon" aria-hidden>☾</span>
      <span className="cq2-theme-thumb" />
    </span>
  </Button>
);
