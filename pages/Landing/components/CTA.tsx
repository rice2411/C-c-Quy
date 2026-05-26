import React from 'react';
import { Reveal, MagBtn } from './Shared';

const CTA: React.FC = () => (
  <section id="contact" className="cq2-cta">
    <div className="cq2-cta-grid" />
    <div className="cq2-cta-inner">
      <Reveal variant="up">
        <p className="cq2-cta-kicker">⌘ Bắt đầu</p>
      </Reveal>
      <Reveal variant="up" delay={120}>
        <h2 className="cq2-cta-head">
          Gửi <em className="cq2-script-gold">yêu thương</em><br />
          qua từng chiếc bánh.
        </h2>
      </Reveal>
      <Reveal variant="up" delay={300}>
        <p className="cq2-cta-sub">
          Đặt bánh nhanh chóng — chúng tôi sẵn sàng nướng bánh cho dịp đặc biệt của bạn.
        </p>
      </Reveal>
      <Reveal variant="up" delay={400}>
        <div className="cq2-cta-row">
          <MagBtn to="/orders" variant="gold">Đặt bánh ngay →</MagBtn>
          <MagBtn href="tel:+84776750418" variant="dark">☎ 0776 750 418</MagBtn>
        </div>
      </Reveal>
    </div>
  </section>
);

export default CTA;
