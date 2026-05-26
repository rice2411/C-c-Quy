import React, { useState } from 'react';
import { Reveal } from './Shared';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSent(true);
  };
  return (
    <section className="cq2-news">
      <div className="cq2-news-inner">
        <Reveal variant="up">
          <p className="cq2-cta-kicker">✦ Bản tin Cúc Quy</p>
        </Reveal>
        <Reveal variant="up" delay={120}>
          <h2 className="cq2-news-head">
            Đăng ký nhận <em className="cq2-script-gold">deal sớm</em><br />
            cho khách thân thiết.
          </h2>
        </Reveal>
        <Reveal variant="up" delay={250}>
          <form onSubmit={submit} className="cq2-news-form">
            <input
              type="email"
              required
              placeholder="email@cucquy.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cq2-news-input"
              disabled={sent}
            />
            <button type="submit" className="cq2-news-btn" disabled={sent}>
              {sent ? '✓ Đã đăng ký' : 'Đăng ký →'}
            </button>
          </form>
        </Reveal>
        <Reveal variant="up" delay={350}>
          <p className="cq2-news-fine">
            Mỗi tháng 1 email · không spam · huỷ bất cứ lúc nào.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default Newsletter;
