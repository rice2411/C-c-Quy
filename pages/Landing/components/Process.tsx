import React from 'react';
import { Reveal } from './Shared';

const processSteps = [
  { num: '01', title: 'Chọn nguyên liệu', desc: 'Bơ Pháp, bột mì cao cấp, sô-cô-la Bỉ. Mọi nguyên liệu đều được tuyển chọn kỹ lưỡng.', icon: '🌾' },
  { num: '02', title: 'Trộn bột thủ công', desc: 'Tỷ lệ chính xác, ủ bột đúng thời gian để bánh đạt độ giòn — mềm — xốp hoàn hảo.', icon: '🥣' },
  { num: '03', title: 'Nướng tươi mỗi ngày', desc: 'Lò nướng nhiệt độ kiểm soát chính xác. Mẻ bánh ra lò vẫn còn ấm khi đến tay bạn.', icon: '🔥' },
  { num: '04', title: 'Đóng gói cẩn thận', desc: 'Hộp giấy thân thiện môi trường, ghi chú handmade — sẵn sàng làm quà tặng.', icon: '🎀' },
];

const Process: React.FC = () => (
  <section className="cq2-process">
    <div className="cq2-process-head">
      <Reveal variant="left">
        <div className="cq2-section-label">
          <span className="cq2-section-num">03</span>
          <span>Quy trình</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Từ căn bếp <em className="cq2-script-gold">đến tay bạn</em>
        </h2>
      </Reveal>
    </div>
    <div className="cq2-process-grid">
      {processSteps.map((p, i) => (
        <Reveal key={p.num} variant="up" delay={200 + i * 120} className="cq2-process-step">
          <div className="cq2-process-num">{p.num}</div>
          <div className="cq2-process-icon">{p.icon}</div>
          <h3 className="cq2-process-title">{p.title}</h3>
          <p className="cq2-process-desc">{p.desc}</p>
          {i < processSteps.length - 1 && <div className="cq2-process-line" />}
        </Reveal>
      ))}
    </div>
  </section>
);

export default Process;
