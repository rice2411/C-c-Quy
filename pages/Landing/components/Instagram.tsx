import React from 'react';
import { Reveal, MagBtn } from './Shared';

const igPosts = [
  { emoji: '🍪', tone: 'a', label: 'Cookies' },
  { emoji: '🍫', tone: 'b', label: 'Brownies' },
  { emoji: '🎂', tone: 'c', label: 'Birthday' },
  { emoji: '💝', tone: 'd', label: 'Valentine' },
  { emoji: '🎄', tone: 'a', label: 'Noel set' },
  { emoji: '🌷', tone: 'd', label: '8/3' },
  { emoji: '☕', tone: 'b', label: 'Coffee combo' },
  { emoji: '🎁', tone: 'c', label: 'Gift box' },
];

const Instagram: React.FC = () => (
  <section className="cq2-ig">
    <div className="cq2-ig-head">
      <Reveal variant="up">
        <div className="cq2-section-label">
          <span className="cq2-section-num">07</span>
          <span>Instagram</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Theo dõi <em className="cq2-script-gold">@cucquy.bakery</em>
        </h2>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-ig-lead">Cập nhật mỗi ngày — sản phẩm mới, hậu trường, ưu đãi sớm.</p>
      </Reveal>
    </div>
    <div className="cq2-ig-grid">
      {igPosts.map((p, i) => (
        <Reveal key={i} variant="scale" delay={150 + i * 70} className={`cq2-ig-post cq2-tone-${p.tone}`}>
          <span className="cq2-ig-emoji">{p.emoji}</span>
          <span className="cq2-ig-label">{p.label}</span>
          <span className="cq2-ig-overlay">
            <span>❤️ {Math.floor(Math.random() * 200) + 50}</span>
            <span>💬 {Math.floor(Math.random() * 30) + 5}</span>
          </span>
        </Reveal>
      ))}
    </div>
    <Reveal variant="up" delay={800}>
      <div className="cq2-ig-cta">
        <MagBtn href="https://instagram.com" variant="dark">
          Theo dõi trên Instagram ↗
        </MagBtn>
      </div>
    </Reveal>
  </section>
);

export default Instagram;
