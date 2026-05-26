import React from 'react';
import { Marquee } from './Shared';

export const MarqueeBand: React.FC = () => (
  <Marquee
    items={[
      'CÚC QUY · 2025',
      'HANDMADE WITH LOVE',
      'COOKIE LẠNH',
      'NGON LẠNH MỀM XỐP',
      'SET QUÀ TẶNG',
      'NGỌT NGÀO HẰNG NGÀY',
    ]}
  />
);

export const MarqueeBand2: React.FC = () => (
  <Marquee
    reverse
    bg="#D87E2D"
    color="#FFF5E5"
    items={[
      'ĐẶT BÁNH NGAY',
      '0776 750 418',
      'GIAO TẬN NƠI',
      'CÚC QUY · BAKERY',
      'CHẤT LƯỢNG ĐẢM BẢO',
      'HAPPY HANDS · HAPPY HEARTS',
    ]}
  />
);
