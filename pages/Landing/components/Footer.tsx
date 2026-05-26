import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="cq2-footer">
    <div className="cq2-footer-top">
      <div className="cq2-footer-brand">
        <span className="cq2-footer-logo">Cúc Quy</span>
        <span className="cq2-footer-mark">✦ 2025 ✦</span>
      </div>
      <div className="cq2-footer-meta">
        <div>
          <div className="cq2-footer-h">Liên hệ</div>
          <a href="tel:+84776750418">0776 750 418</a>
          <span>Huế, Việt Nam</span>
        </div>
        <div>
          <div className="cq2-footer-h">Menu</div>
          <a href="#menu">Cookies</a>
          <a href="#menu">Brownies</a>
          <a href="#menu">Set quà</a>
        </div>
        <div>
          <div className="cq2-footer-h">Theo dõi</div>
          <a href="#">Instagram</a>
          <a href="#">Facebook</a>
          <a href="#">TikTok</a>
        </div>
      </div>
    </div>
    <div className="cq2-footer-bot">
      <span>© Cúc Quy Bakery — Made with 💗 in Hue</span>
      <Link to="/login">Đăng nhập</Link>
    </div>
  </footer>
);

export default Footer;
