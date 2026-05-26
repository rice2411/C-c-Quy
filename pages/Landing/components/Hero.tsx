import React, { useEffect, useRef } from 'react';
import { MagBtn, CookieMedia } from './Shared';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      heroRef.current.style.setProperty('--mx', `${x}px`);
      heroRef.current.style.setProperty('--my', `${y}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section ref={heroRef} className="cq2-hero">
      {/* grid overlay */}
      <div className="cq2-hero-grid" />

      {/* floating elements */}
      <div className="cq2-hero-float cq2-hero-float-1">
        <CookieMedia flavor="choco" size={180} />
      </div>
      <div className="cq2-hero-float cq2-hero-float-2">
        <CookieMedia flavor="matcha" size={130} />
      </div>
      <div className="cq2-hero-float cq2-hero-float-3">
        <CookieMedia flavor="redvelvet" size={150} />
      </div>

      {/* top nav */}
      <div className="cq2-nav">
        <div className="cq2-nav-brand">
          <span className="cq2-nav-dot" />
          CÚC QUY · EST · 2025
        </div>
        <div className="cq2-nav-links">
          <a href="#menu">Menu</a>
          <a href="#story">Câu chuyện</a>
          <a href="#contact">Liên hệ</a>
        </div>
      </div>

      {/* Vertical side label */}
      <div className="cq2-side-label cq2-side-label-left">
        <span>HANDMADE BAKERY · SAIGON · 2025</span>
      </div>
      <div className="cq2-side-label cq2-side-label-right">
        <span>SCROLL TO DISCOVER ↓ ✦ NGỌT NGÀO HẰNG NGÀY ✦</span>
      </div>

      {/* Main type */}
      <div className="cq2-hero-inner">
        <div className="cq2-hero-eyebrow">
          <span className="cq2-line" /> Tiệm bánh handmade — Cookies · Brownies · Set quà
        </div>

        <h1 className="cq2-hero-headline">
          <span className="cq2-h-row">
            <em className="cq2-script">Cúc</em>
            <span className="cq2-blob" />
            <span className="cq2-h-word">NGỌT</span>
          </span>
          <span className="cq2-h-row cq2-h-row-2">
            <span className="cq2-h-word cq2-h-word-outline">NGÀO</span>
            <em className="cq2-script">Quy</em>
          </span>
        </h1>

        <div className="cq2-hero-foot">
          <p className="cq2-hero-claim">
            Bánh ngon từ trái tim — <em>made with love, baked fresh every day.</em>
          </p>
          <div className="cq2-hero-cta">
            <MagBtn href="#menu" variant="gold">
              Khám phá menu ↗
            </MagBtn>
            <MagBtn to="/orders" variant="ghost">
              Đặt ngay
            </MagBtn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
