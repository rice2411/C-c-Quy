import React from 'react';
import { Reveal } from './Shared';

import Heading from '@/components/ui/Heading';
const testimonials = [
  { quote: 'Bánh ngon xuất sắc, cookies lạnh mềm tan ngay trong miệng. Đặt mãi không chán!', name: 'Mai Anh', role: 'Khách quen · 2 năm', stars: 5 },
  { quote: 'Set quà Valentine năm nay đẹp ngỡ ngàng. Người yêu mở ra xong khóc thiệt luôn 🥹', name: 'Tuấn Khang', role: 'Sinh viên', stars: 5 },
  { quote: 'Mình đặt 50 hộp brownies cho event công ty. Khách feedback siêu tốt. Sẽ quay lại!', name: 'Chị Hằng', role: 'Marketing Lead', stars: 5 },
  { quote: 'Cúc Quy không chỉ bán bánh mà còn bán cảm xúc. Mỗi lần nhận hộp là 1 lần được vui.', name: 'Linh', role: 'Khách hàng', stars: 5 },
];

const Testimonials: React.FC = () => (
  <section className="cq2-testimonials">
    <div className="cq2-testimonials-head">
      <Reveal variant="up">
        <div className="cq2-section-label cq2-section-label-dark">
          <span className="cq2-section-num">05</span>
          <span>Lời cảm ơn</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <Heading level={2} textClassName="cq2-h-big cq2-h-dark">
          Khách yêu thương — <em className="cq2-script-orange">chúng tôi biết ơn</em>
        </Heading>
      </Reveal>
    </div>
    <div className="cq2-testimonials-grid">
      {testimonials.map((t, i) => (
        <Reveal key={t.name} variant="up" delay={250 + i * 130} className="cq2-testi">
          <div className="cq2-testi-stars">{'★'.repeat(t.stars)}</div>
          <p className="cq2-testi-quote">"{t.quote}"</p>
          <div className="cq2-testi-meta">
            <div className="cq2-testi-avatar">{t.name.charAt(0)}</div>
            <div>
              <div className="cq2-testi-name">{t.name}</div>
              <div className="cq2-testi-role">{t.role}</div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

export default Testimonials;
