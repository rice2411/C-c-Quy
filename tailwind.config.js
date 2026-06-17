/**
 * Tailwind (cài build-time, thay cho Play CDN) — Design system "Nhân Hòa".
 * Brand: teal #4abab9 (primary) + đỏ #e40014. Class `primary-*` trỏ về thang teal.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './{pages,components,contexts,utils,config,constant,hooks,i18n,services,types}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
        brand: { teal: '#4abab9', red: '#e40014' },
      },
      borderRadius: { token: '0.625rem' }, // 10px theo Nhân Hòa
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
