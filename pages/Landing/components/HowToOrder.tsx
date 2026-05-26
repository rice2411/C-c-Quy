import React from 'react';
import { Reveal } from './Shared';

const HowToOrder: React.FC = () => (
  <section className="cq2-how">
    <div className="cq2-how-head">
      <Reveal variant="up">
        <div className="cq2-section-label">
          <span className="cq2-section-num">06</span>
          <span>Đặt bánh</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Đặt bánh siêu dễ — <em className="cq2-script-gold">3 bước</em>
        </h2>
      </Reveal>
    </div>
    <div className="cq2-how-grid">
      {[
        { n: '01', t: 'Chọn menu', d: 'Lướt menu, chọn vị yêu thích hoặc set quà phù hợp dịp.', emoji: '🍪' },
        { n: '02', t: 'Liên hệ đặt', d: 'Inbox Zalo hoặc gọi 0776 750 418. Báo số lượng, ngày nhận.', emoji: '💬' },
        { n: '03', t: 'Nhận bánh', d: 'Tự đến lấy hoặc giao tận nơi. Thanh toán tiền mặt / chuyển khoản.', emoji: '🚚' },
      ].map((s, i) => (
        <Reveal key={s.n} variant="scale" delay={200 + i * 150} className="cq2-how-step">
          <div className="cq2-how-emoji">{s.emoji}</div>
          <div className="cq2-how-num">{s.n}</div>
          <h3 className="cq2-how-title">{s.t}</h3>
          <p className="cq2-how-desc">{s.d}</p>
        </Reveal>
      ))}
    </div>
  </section>
);

export default HowToOrder;
