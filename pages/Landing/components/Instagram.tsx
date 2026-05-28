import React from 'react';
import { Facebook, Instagram as InstagramIcon, ArrowUpRight } from 'lucide-react';
import { Reveal } from './Shared';

import Heading from '@/components/ui/Heading';
// Inline SVG cho TikTok + Zalo (lucide không có)
const TikTokIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M33.6 6h-6.4v26.2c0 3.2-2.6 5.8-5.8 5.8s-5.8-2.6-5.8-5.8 2.6-5.8 5.8-5.8c.6 0 1.2.1 1.8.3v-6.5c-.6-.1-1.2-.1-1.8-.1-6.7 0-12.1 5.4-12.1 12.1s5.4 12.1 12.1 12.1 12.1-5.4 12.1-12.1V18.5c2.4 1.7 5.3 2.7 8.5 2.7v-6.4c-4.6 0-8.4-3.8-8.4-8.8z"
      fill="currentColor"
    />
  </svg>
);

const ZaloIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M24 4C12.95 4 4 11.95 4 21.5c0 5.1 2.55 9.65 6.55 12.75-.3.8-1 2.85-1.45 3.85-.55 1.25-.05 1.3.55 1.05 1.3-.55 4.3-2.4 5.5-3.05 2.7.95 5.65 1.4 8.85 1.4 11.05 0 20-7.95 20-17.5S35.05 4 24 4z"
      fill="currentColor"
    />
    <text
      x="24"
      y="27"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
      fontSize="11"
      fontWeight="900"
      fill="#FFFFFF"
      letterSpacing="-0.5"
    >
      Zalo
    </text>
  </svg>
);

interface Social {
  name: string;
  handle: string;
  url: string;
  Icon: React.FC<{ size?: number }>;
  gradient: string;
  accent: string;
}

const socials: Social[] = [
  {
    name: 'Facebook',
    handle: '@cucquy.bakery',
    url: 'https://facebook.com/cucquy.bakery',
    Icon: ({ size = 48 }) => <Facebook size={size} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0C5DCE 100%)',
    accent: '#1877F2',
  },
  {
    name: 'Instagram',
    handle: '@cucquy.bakery',
    url: 'https://instagram.com/cucquy.bakery',
    Icon: ({ size = 48 }) => <InstagramIcon size={size} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
    accent: '#DD2A7B',
  },
  {
    name: 'TikTok',
    handle: '@cucquy.bakery',
    url: 'https://tiktok.com/@cucquy.bakery',
    Icon: TikTokIcon,
    gradient: 'linear-gradient(135deg, #25F4EE 0%, #000000 50%, #FE2C55 100%)',
    accent: '#FE2C55',
  },
  {
    name: 'Zalo',
    handle: '0776 750 418',
    url: 'https://zalo.me/0776750418',
    Icon: ZaloIcon,
    gradient: 'linear-gradient(135deg, #0068FF 0%, #0050D0 100%)',
    accent: '#0068FF',
  },
];

const Instagram: React.FC = () => (
  <section className="cq2-ig">
    <div className="cq2-ig-head">
      <Reveal variant="up">
        <div className="cq2-section-label">
          <span className="cq2-section-num">07</span>
          <span>Kết nối</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <Heading level={2} textClassName="cq2-h-big">
          Theo dõi <em className="cq2-script-gold">Cúc Quy</em>
        </Heading>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-ig-lead">
          Cập nhật mỗi ngày — sản phẩm mới, hậu trường, ưu đãi sớm. Chọn nền tảng yêu thích bên dưới.
        </p>
      </Reveal>
    </div>

    <div className="cq2-social-grid">
      {socials.map((s, i) => {
        const Icon = s.Icon;
        return (
          <Reveal key={s.name} variant="up" delay={200 + i * 100}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cq2-social-card"
              style={{ ['--accent' as any]: s.accent }}
            >
              <div className="cq2-social-icon" style={{ background: s.gradient }}>
                <Icon size={42} />
              </div>
              <div className="cq2-social-info">
                <div className="cq2-social-name">{s.name}</div>
                <div className="cq2-social-handle">{s.handle}</div>
              </div>
              <span className="cq2-social-arrow">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </span>
            </a>
          </Reveal>
        );
      })}
    </div>
  </section>
);

export default Instagram;
