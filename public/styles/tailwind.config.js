/*
 * Cấu hình Tailwind (Play CDN) — Design system "Nhân Hòa" áp cho CucQuy.
 * Nạp NGAY SAU <script src="https://cdn.tailwindcss.com"> trong index.html.
 *
 * Brand: teal #4abab9 (primary) + đỏ #e40014 (brand.red).
 * Mọi class `primary-*` (vd bg-primary-600, hover:bg-primary-700, ring-primary-500)
 * trỏ về thang teal dưới đây. Trước đây dự án dùng `orange-*` — đã đổi hết sang `primary-*`.
 */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Thang teal thương hiệu (500/600 ~ #4abab9, khớp Nhân Hòa)
        primary: {
          50: '#f0fafa',
          100: '#d7f2f1',
          200: '#b0e6e4',
          300: '#82d4d2',
          400: '#5ec5c3',
          500: '#4abab9',
          600: '#3a9897',
          700: '#327c7b',
          800: '#2d6362',
          900: '#295251',
          950: '#143130',
        },
        // Màu thương hiệu cố định (dùng khi cần đúng hex)
        brand: {
          teal: '#4abab9',
          red: '#e40014',
        },
      },
      borderRadius: {
        // --radius Nhân Hòa = 10px; dùng class `rounded-token`
        token: '0.625rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
};
