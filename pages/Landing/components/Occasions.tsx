import React from 'react';
import { Reveal } from './Shared';

const occasions = [
  { icon: '🎂', name: 'Sinh nhật', desc: 'Bánh kem brownies hoặc set cookies xinh xắn cho buổi tiệc.' },
  { icon: '💝', name: 'Tặng người thương', desc: 'Set quà 8/3, Valentine, kỷ niệm — gói trọn yêu thương.' },
  { icon: '🎄', name: 'Lễ hội & Tết', desc: 'Set Noel, Tết với thiết kế đặc biệt theo mùa.' },
  { icon: '💼', name: 'Quà đối tác', desc: 'Hộp quà cao cấp cho khách hàng, đối tác công ty.' },
  { icon: '🎓', name: 'Tốt nghiệp & Khai trương', desc: 'Set quà mừng dấu mốc quan trọng — ngọt ngào & ý nghĩa.' },
  { icon: '☕', name: 'Họp mặt bạn bè', desc: 'Combo cookies + brownies cho buổi cafe cuối tuần ấm áp.' },
];

const Occasions: React.FC = () => (
  <section className="cq2-occasions">
    <div className="cq2-occasions-head">
      <Reveal variant="up">
        <div className="cq2-section-label">
          <span className="cq2-section-num">04</span>
          <span>Gợi ý</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Đặt bánh cho <em className="cq2-script-gold">mọi dịp</em>
        </h2>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-occasions-lead">Không biết tặng gì? Để chúng tôi gợi ý theo dịp của bạn.</p>
      </Reveal>
    </div>
    <div className="cq2-occasions-grid">
      {occasions.map((o, i) => (
        <Reveal key={o.name} variant="up" delay={300 + i * 80} className="cq2-occasion">
          <div className="cq2-occasion-icon">{o.icon}</div>
          <h3 className="cq2-occasion-name">{o.name}</h3>
          <p className="cq2-occasion-desc">{o.desc}</p>
        </Reveal>
      ))}
    </div>
  </section>
);

export default Occasions;
