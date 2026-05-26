import React from 'react';
import { Reveal } from './Shared';

const Story: React.FC = () => (
  <section id="story" className="cq2-story">
    <div className="cq2-story-inner">
      <div className="cq2-story-left">
        <Reveal variant="left">
          <div className="cq2-section-label">
            <span className="cq2-section-num">01</span>
            <span>Câu chuyện</span>
          </div>
        </Reveal>
      </div>

      <div className="cq2-story-right">
        <Reveal variant="up">
          <h2 className="cq2-h-big">
            Không chỉ là bánh.<br />
            Là <em className="cq2-script-gold">cảm xúc</em> được gói lại.
          </h2>
        </Reveal>
        <Reveal variant="up" delay={200}>
          <p className="cq2-story-text">
            Mỗi chiếc cookie ở Cúc Quy được nướng thủ công bằng nguyên liệu chọn lọc, công thức
            được tinh chỉnh hàng trăm lần để đạt độ giòn ngoài — mềm xốp trong hoàn hảo.
            Chúng tôi tin rằng một chiếc bánh ngon là một lời cảm ơn ngọt ngào, một món quà nhỏ
            mang theo tình cảm lớn.
          </p>
        </Reveal>
        <Reveal variant="up" delay={350}>
          <div className="cq2-pill-row">
            <span className="cq2-pill">🌾 Nguyên liệu chọn lọc</span>
            <span className="cq2-pill">💗 Handmade with love</span>
            <span className="cq2-pill">❄️ Bảo quản lạnh</span>
            <span className="cq2-pill">🔥 Tươi mỗi ngày</span>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

export default Story;
