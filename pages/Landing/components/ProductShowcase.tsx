import React, { useEffect, useRef, useState } from 'react';
import { Reveal, CookieMedia } from './Shared';

export interface ShowcaseProduct {
  no: string;
  tag: string;
  name: string;
  desc: string;
  price?: string;
  priceUnit?: string;
  prices?: Array<{ label: string; value: string; hot?: boolean }>;
  img?: string;
  emoji?: string;
  bg: string;
  accent: string;
}

export const ProductRow: React.FC<{
  product: ShowcaseProduct;
  reverse?: boolean;
  index: number;
}> = ({ product, reverse, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!ref.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current!.getBoundingClientRect();
        const vh = window.innerHeight;
        const center = r.top + r.height / 2;
        const offset = (center - vh / 2) / vh;
        setParallax(offset * 40);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`cq2-product ${visible ? 'is-visible' : ''} ${reverse ? 'is-reverse' : ''}`}
    >
      <div className="cq2-product-num" aria-hidden>{product.no}</div>
      <div
        className="cq2-product-stage"
        style={{
          ['--blob' as any]: product.accent,
          transform: `translateY(${-parallax * 0.4}px)`,
        }}
      >
        <div className="cq2-product-blob" aria-hidden />
        <div
          className="cq2-product-3d"
          style={{
            transform: `perspective(1400px) rotateY(${parallax * (reverse ? -0.25 : 0.25)}deg) rotateX(${parallax * 0.12}deg)`,
          }}
        >
          {product.img ? (
            <img src={product.img} alt={product.name} className="cq2-product-photo" />
          ) : product.emoji ? (
            <span className="cq2-product-emoji">{product.emoji}</span>
          ) : null}
        </div>
        <span
          className="cq2-product-stamp"
          style={{ borderColor: product.accent, color: product.accent }}
        >
          Cúc Quy
        </span>
      </div>
      <div className="cq2-product-text" style={{ transform: `translateY(${parallax * 0.3}px)` }}>
        <div className="cq2-product-tag">
          <span className="cq2-product-dot" style={{ background: product.accent }} />
          {product.tag}
        </div>
        <h3 className="cq2-product-name">{product.name}</h3>
        <p className="cq2-product-desc">{product.desc}</p>
        {product.prices && product.prices.length > 0 ? (
          <div className="cq2-combo-tags cq2-combo-tags-inline">
            {product.prices.map((p) => (
              <div
                key={p.label}
                className={`cq2-combo-tag ${p.hot ? 'cq2-combo-tag-hot' : ''}`}
              >
                <span>{p.label}</span>
                <strong>{p.value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="cq2-product-price-row">
            <div className="cq2-product-price">
              <span>{product.price}</span>
              <small>{product.priceUnit ?? '/ cái'}</small>
            </div>
            <span className="cq2-product-arrow" style={{ color: product.accent }}>→</span>
          </div>
        )}
      </div>
    </div>
  );
};

const showcaseProducts = [
  {
    no: '02',
    tag: '❄️ Cookies Lạnh · Signature',
    name: 'Chocolate Lava Lạnh',
    desc: 'Bên ngoài giòn nhẹ, vừa cắn lớp sô-cô-la tan chảy bung ra như nham thạch. Để tủ lạnh 30 phút trước khi ăn để cảm nhận trọn vẹn.',
    price: '25K',
    img: '/cold_cookies_chocolate.png',
    bg: 'radial-gradient(circle at 40% 30%, #3D2418, #1A0E08)',
    accent: '#D87E2D',
  },
  {
    no: '03',
    tag: '❄️ Cookies Lạnh · Signature',
    name: 'Matcha Cream Cheese Lạnh',
    desc: 'Bột matcha Uji thượng hạng phủ ngoài, nhân cream cheese béo nhẹ bên trong. Vị chát thanh — béo dịu — lạnh mát như cơn gió Tokyo.',
    price: '25K',
    img: '/cold_cookies_matcha.png',
    bg: 'radial-gradient(circle at 60% 30%, #5E7E47, #3D5128)',
    accent: '#6B8E5A',
  },
  {
    no: '04',
    tag: '❄️ Cookies Lạnh · Signature',
    name: 'Tiramisu Cookie Lạnh',
    desc: 'Cốt cookie thấm vị espresso đậm đà, phủ bột cacao mịn trên cùng. Một miếng — như đang ngồi quán cafe ở Roma.',
    price: '25K',
    img: '/cold_cookies_cafe.png',
    bg: 'radial-gradient(circle at 40% 50%, #7A5530, #4A3018)',
    accent: '#A37734',
  },
  {
    no: '05',
    tag: '❄️ Cookies Lạnh · Signature',
    name: 'Red Velvet Cream Lạnh',
    desc: 'Đỏ rực rỡ với vị ca-cao êm dịu, nhân cream cheese mượt mà. Cắn vào là tan — đẹp như một nụ hôn.',
    price: '25K',
    img: '/cold_cookies_redverlet.png',
    bg: 'radial-gradient(circle at 50% 50%, #7A1F1F, #4A0E0E)',
    accent: '#C84B5C',
  },
  {
    no: '06',
    tag: '🍫 Brownies',
    name: 'Brownies đậm đà',
    desc: 'Cốt brownie giàu cacao, ẩm và đậm. Thưởng thức cùng một ly sữa lạnh — vị đắng cacao quyện đường nâu tan dần trong miệng.',
    prices: [
      { label: 'Lẻ 1 cái', value: '9K' },
      { label: 'Hộp nhỏ', value: '35K', hot: true },
      { label: 'Hộp to', value: '40K' },
    ],
    img: '/brownie.png',
    bg: 'radial-gradient(circle at 30% 30%, #6B4A2C, #2A1810)',
    accent: '#8B5A3C',
  },
  {
    no: '07',
    tag: '🍪 Hộp quà mini',
    name: 'Hộp Cúc Quy Mini',
    desc: 'Hộp quà nhỏ xinh, vừa tay — đầy ắp cookies mini đáng yêu. Quà tặng nhanh gọn ý nghĩa cho người đặc biệt.',
    prices: [
      { label: 'Hộp nhỏ', value: '50K' },
      { label: 'Hộp to', value: '70K', hot: true },
    ],
    img: '/cucquy_mini.png',
    bg: 'radial-gradient(circle at 60% 60%, #C9954A, #A37734)',
    accent: '#C9954A',
  },
];

const traditionalCookies = [
  { f: 'choco' as const, name: 'Socola' },
  { f: 'cafe' as const, name: 'Cafe' },
  { f: 'matcha' as const, name: 'Matcha Cheese' },
  { f: 'redvelvet' as const, name: 'Red Velvet' },
];

const TraditionalRow: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`cq2-product cq2-product-gallery ${visible ? 'is-visible' : ''}`}>
      <div className="cq2-product-num" aria-hidden>01</div>
      <div className="cq2-trad-images">
        <div className="cq2-trad-bg" />
        {traditionalCookies.map((c, i) => (
          <div key={c.f} className={`cq2-trad-cookie cq2-trad-cookie-${i + 1}`}>
            <CookieMedia flavor={c.f} size={150} />
            <span className="cq2-trad-name">{c.name}</span>
          </div>
        ))}
      </div>
      <div className="cq2-product-text">
        <div className="cq2-product-tag">
          <span className="cq2-product-dot" style={{ background: '#D87E2D' }} />
          Cookies truyền thống
        </div>
        <h3 className="cq2-product-name">Bốn vị kinh điển<br />— mỗi ngày tươi mới</h3>
        <p className="cq2-product-desc">
          Socola · Cafe · Matcha Cheese · Red Velvet Cheese. Giòn rụm bên ngoài, mềm xốp bên trong.
          Bắt đầu hành trình Cúc Quy với 4 vị quen thuộc nhất.
        </p>
        <div className="cq2-combo-tags">
          <div className="cq2-combo-tag">
            <span>1 cái</span>
            <strong>9K</strong>
          </div>
          <div className="cq2-combo-tag cq2-combo-tag-hot">
            <span>Combo tình bạn · 3 cái</span>
            <strong>22K</strong>
          </div>
          <div className="cq2-combo-tag">
            <span>Combo gia đình · 5 cái</span>
            <strong>35K</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductShowcase: React.FC = () => (
  <section id="menu" className="cq2-showcase">
    <div className="cq2-showcase-head">
      <Reveal variant="left">
        <div className="cq2-section-label">
          <span className="cq2-section-num">02</span>
          <span>Menu</span>
        </div>
      </Reveal>
      <Reveal variant="up" delay={150}>
        <h2 className="cq2-h-big">
          Từng <em className="cq2-script-gold">chiếc bánh</em><br />
          ra mắt bạn.
        </h2>
      </Reveal>
      <Reveal variant="up" delay={250}>
        <p className="cq2-showcase-lead">
          Cuộn xuống — mỗi sản phẩm sẽ kể câu chuyện của riêng nó.
        </p>
      </Reveal>
    </div>

    <div className="cq2-products">
      <TraditionalRow />
      {showcaseProducts.map((p, i) => (
        <ProductRow key={p.no} product={p} reverse={i % 2 === 0} index={i} />
      ))}
    </div>
  </section>
);

export default ProductShowcase;
