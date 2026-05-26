import React from 'react';
import { Reveal } from './Shared';
import { ProductRow, ShowcaseProduct } from './ProductShowcase';

const giftRows: ShowcaseProduct[] = [
  {
    no: '01',
    tag: '💐 Set quà · Bó hoa',
    name: 'Set Hoa',
    desc: 'Bánh quy xinh xắn như những bông hoa, gửi thông điệp dịu dàng đến người đặc biệt. Mỗi bó được gói thủ công, độc đáo.',
    prices: [
      { label: 'Bó nhỏ', value: '80K' },
      { label: 'Bó lớn', value: '200K', hot: true },
    ],
    img: '/sethoa.png',
    bg: 'radial-gradient(circle at 70% 30%, #E8A4A4, #C26565)',
    accent: '#E8A4A4',
  },
  {
    no: '02',
    tag: '🌷 Set quà · 8/3',
    name: 'Set 8/3 — Phụ nữ ngọt ngào',
    desc: 'Ngọt ngào kết hợp bánh và phụ kiện đáng yêu, thay bạn gửi lời yêu thương đến mẹ, chị, vợ, bạn gái trong ngày của họ.',
    prices: [
      { label: 'Set cơ bản', value: '80K' },
      { label: 'Set đầy đủ', value: '200K', hot: true },
    ],
    emoji: '🌷',
    bg: 'radial-gradient(circle at 50% 30%, #E892B5, #B85A82)',
    accent: '#E892B5',
  },
  {
    no: '03',
    tag: '🎄 Set quà · Noel',
    name: 'Set Noel — Ấm áp giáng sinh',
    desc: 'Cookies & brownies mini cùng trang trí Noel ấm áp, rộn ràng mùa lễ hội. Quà tặng cho gia đình hoặc thân hữu vào dịp cuối năm.',
    prices: [
      { label: 'Set nhỏ', value: '80K' },
      { label: 'Set lớn', value: '200K', hot: true },
    ],
    img: '/set_qua_noel.png',
    bg: 'radial-gradient(circle at 40% 50%, #6B8E5A, #3D5128)',
    accent: '#6B8E5A',
  },
  {
    no: '04',
    tag: '💝 Set quà · Valentine',
    name: 'Set Valentine — Tình yêu ngọt',
    desc: 'Bánh đặc biệt thay lời thương yêu — chiếc hộp ngọt ngào nhất tháng 2. Bất ngờ dễ thương cho người ấy.',
    prices: [
      { label: 'Hộp duo', value: '80K' },
      { label: 'Hộp deluxe', value: '200K', hot: true },
    ],
    emoji: '💝',
    bg: 'radial-gradient(circle at 50% 50%, #C84B5C, #7A1F1F)',
    accent: '#C84B5C',
  },
];

const GiftSets: React.FC = () => (
  <section className="cq2-gift-showcase">
    <div className="cq2-showcase-head">
      <Reveal variant="left">
        <div className="cq2-section-label">
          <span className="cq2-section-num">03</span>
          <span>Set quà tặng</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Quà tặng — <em className="cq2-script-gold">gói cảm xúc</em>
        </h2>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-showcase-lead">
          Giá từ <strong>80.000đ — 200.000đ</strong> · thương lượng theo yêu cầu của bạn.
        </p>
      </Reveal>
    </div>

    <div className="cq2-products">
      {giftRows.map((g, i) => (
        <ProductRow key={g.no} product={g} reverse={i % 2 === 1} index={i} />
      ))}
    </div>
  </section>
);

export default GiftSets;
