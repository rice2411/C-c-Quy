import React, { useState } from 'react';
import { Reveal } from './Shared';

import Heading from '@/components/ui/Heading';
import Button from '@/components/ui/Button';
const faqs = [
  { q: 'Tôi cần đặt bánh trước bao lâu?', a: 'Cookies/brownies lẻ: đặt trước 1-2 tiếng. Set quà tặng và bánh theo yêu cầu: 24-48h trước ngày nhận để có chất lượng tốt nhất.' },
  { q: 'Có giao hàng tận nơi không?', a: 'Có. Chúng tôi giao trong khu vực TP.HCM với phí giao tùy quận. Đặt từ 200K được hỗ trợ giao gần miễn phí.' },
  { q: 'Bánh bảo quản như thế nào?', a: 'Cookies truyền thống: thường nhiệt 3-5 ngày. Cookies lạnh: ngăn mát 5-7 ngày, ngon nhất khi dùng lạnh. Brownies: 3 ngày ngoài / 1 tuần ngăn mát.' },
  { q: 'Có nhận đơn theo yêu cầu riêng không?', a: 'Có. Bạn có thể yêu cầu thiết kế set quà riêng, viết chữ trên bánh, kết hợp các vị khác nhau. Liên hệ Zalo để tư vấn chi tiết.' },
  { q: 'Thanh toán bằng những hình thức nào?', a: 'Tiền mặt khi nhận, chuyển khoản ngân hàng, hoặc quét QR. Set quà cao cấp yêu cầu cọc 50% trước.' },
  { q: 'Nguyên liệu có rõ nguồn gốc không?', a: 'Tất cả nguyên liệu đều có nguồn gốc rõ ràng — bơ Pháp, sô-cô-la Bỉ, bột mì cao cấp. Hạn chế dùng chất bảo quản tối đa.' },
];

const FAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="cq2-faq">
      <div className="cq2-faq-head">
        <Reveal variant="left">
          <div className="cq2-section-label">
            <span className="cq2-section-num">08</span>
            <span>FAQ</span>
          </div>
        </Reveal>
        <Reveal variant="up" delay={150}>
          <Heading level={2} textClassName="cq2-h-big">
            Câu hỏi <em className="cq2-script-gold">thường gặp</em>
          </Heading>
        </Reveal>
      </div>
      <div className="cq2-faq-list">
        {faqs.map((f, i) => {
          const open = openIdx === i;
          return (
            <Reveal key={f.q} variant="up" delay={150 + i * 80}>
              <Button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className={`cq2-faq-item ${open ? 'is-open' : ''}`}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <span className="cq2-faq-q">
                  <span className="cq2-faq-num">0{i + 1}</span>
                  <span>{f.q}</span>
                </span>
                <span className="cq2-faq-toggle">{open ? '−' : '+'}</span>
                <span className="cq2-faq-a">
                  <span>{f.a}</span>
                </span>
              </Button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};

export default FAQ;
