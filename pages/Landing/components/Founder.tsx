import React, { useEffect, useRef, useState } from 'react';
import { Reveal } from './Shared';

const founders = [
  {
    img: '/person1.jpeg',
    initial: 'C',
    name: 'Cúc',
    role: 'Chef · Editor Video & Ảnh',
    quote: 'Mỗi sáng đứng trước căn bếp, tôi tự hỏi: "Hôm nay bánh nào sẽ làm ai đó mỉm cười?" — và bắt đầu nướng.',
    skill: ['Làm bánh', 'Quay & Dựng video', 'Chụp ảnh sản phẩm'],
    accent: '#D87E2D',
  },
  {
    img: '/person2.jpeg',
    initial: 'Q',
    name: 'Quy',
    role: 'Branding · Chương trình · Vận hành',
    quote: 'Tôi tin một chiếc bánh ngon cần một chiếc hộp đẹp. Cách bạn mở hộp quà — chính là phần đầu của niềm vui.',
    skill: ['Branding', 'Chương trình KM', 'Quản lý vận hành'],
    accent: '#6B8E5A',
  },
];

const FounderCard: React.FC<{ founder: typeof founders[0]; delay: number }> = ({ founder, delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!ref.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current!.getBoundingClientRect();
        const vh = window.innerHeight;
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        setParallax(off * 25);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`cq2-founder-card ${visible ? 'is-visible' : ''}`}
      style={{
        ['--blob' as any]: founder.accent,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="cq2-founder-stage">
        <div className="cq2-founder-blob" />
        <div
          className="cq2-founder-3d"
          style={{
            transform: `perspective(1200px) rotateY(${parallax * 0.3}deg) rotateX(${parallax * 0.1}deg)`,
          }}
        >
          {founder.img
            ? <img src={founder.img} alt={founder.name} className="cq2-founder-portrait-img" />
            : <span className="cq2-founder-portrait-emoji">{founder.initial}</span>}
        </div>
        <span className="cq2-founder-initial" style={{ color: founder.accent }}>{founder.initial}</span>
      </div>
      <div className="cq2-founder-info">
        <div className="cq2-founder-meta">
          <span className="cq2-founder-dot" style={{ background: founder.accent }} />
          <span>Co-founder</span>
        </div>
        <h3 className="cq2-founder-name">
          <em className="cq2-script-gold">{founder.name}</em>
        </h3>
        <p className="cq2-founder-role-text">{founder.role}</p>
        <p className="cq2-founder-quote-small">"{founder.quote}"</p>
        <div className="cq2-founder-skills">
          {founder.skill.map((s) => (
            <span key={s} className="cq2-skill-pill" style={{ borderColor: founder.accent + '66' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Founder: React.FC = () => (
  <section className="cq2-founders">
    <div className="cq2-founders-bg" />
    <div className="cq2-founders-head">
      <Reveal variant="up">
        <div className="cq2-section-label">
          <span className="cq2-section-num">★</span>
          <span>Người làm Cúc Quy</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Hai người — <em className="cq2-script-gold">một niềm vui</em>
        </h2>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-founders-lead">
          Cúc Quy được sinh ra từ căn bếp nhỏ của hai người bạn — một làm bánh, một làm đẹp.
          Cùng nhau gửi gắm niềm vui qua từng chiếc cookie.
        </p>
      </Reveal>
    </div>

    <div className="cq2-founders-grid">
      {founders.map((f, i) => (
        <FounderCard key={f.name} founder={f} delay={i * 200} />
      ))}
    </div>

    <Reveal variant="up" delay={500}>
      <div className="cq2-founders-together">
        <span className="cq2-script-gold cq2-together-text">— Cúc</span>
        <span className="cq2-together-plus">+</span>
        <span className="cq2-script-gold cq2-together-text">Quy —</span>
      </div>
    </Reveal>
  </section>
);

export default Founder;
