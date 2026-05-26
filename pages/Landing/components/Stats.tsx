import React from 'react';
import { Reveal } from './Shared';
import { useCounter } from './hooks';

const Stats: React.FC = () => {
  const c1 = useCounter(2025);
  const c2 = useCounter(13);
  const c3 = useCounter(100);
  return (
    <section className="cq2-stats">
      <Reveal variant="up">
        <div className="cq2-stats-grid">
          <div className="cq2-stat" ref={c1.ref}>
            <div className="cq2-stat-num">{c1.n}</div>
            <div className="cq2-stat-label">Năm thành lập</div>
          </div>
          <div className="cq2-stat" ref={c2.ref}>
            <div className="cq2-stat-num">{c2.n}+</div>
            <div className="cq2-stat-label">Vị bánh signature</div>
          </div>
          <div className="cq2-stat" ref={c3.ref}>
            <div className="cq2-stat-num">{c3.n}%</div>
            <div className="cq2-stat-label">Handmade · Tươi mỗi ngày</div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default Stats;
