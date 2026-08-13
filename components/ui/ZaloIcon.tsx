import React from 'react';

/**
 * ZaloIcon — logo Zalo (ô bo góc xanh #0068FF + wordmark trắng). Dùng cho nav/header
 * tính năng Zalo. Kích thước điều khiển qua className (vd "h-5 w-5"); màu thương hiệu
 * cố định, không theo currentColor.
 */
const ZaloIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
    <rect x="1" y="1" width="46" height="46" rx="12" fill="#0068FF" />
    <text
      x="24"
      y="31"
      textAnchor="middle"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="700"
      fontSize="17"
      fill="#ffffff"
    >
      Zalo
    </text>
  </svg>
);

export default ZaloIcon;
