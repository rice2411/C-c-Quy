# styles/ — Design system "Nhân Hòa" cho CucQuy

Toàn bộ cấu hình màu / bo góc / font / token tập trung ở đây. Brand: **teal `#4abab9`** (primary) + đỏ `#e40014`.

## File
| File | Vai trò |
|---|---|
| `tailwind.config.js` | Cấu hình Tailwind (Play CDN). Định nghĩa thang màu `primary` (teal 50–950), `brand.teal/red`, `rounded-token` (10px), font Inter. **Nạp ngay sau** `<script src="cdn.tailwindcss.com">` trong `index.html`. |
| `tokens.css` | Biến CSS (`--color-primary`, `--chart-1..5`, `--radius`, semantic...) dùng cho recharts / inline style / CSS thuần. Có `.dark` override + helper `.btn-primary`. |

## Cách dùng
- **Màu brand trong JSX:** dùng class `primary-*` — vd `bg-primary-600`, `text-primary-600`, `hover:bg-primary-700`, `ring-primary-500`, `bg-primary-900/20`. (Trước đây toàn bộ dùng `orange-*`, đã đổi hết sang `primary-*`.)
- **Đúng hex (chart, inline):** `var(--color-primary)`, `var(--chart-2)`... hoặc hex `#4abab9`.
- **Bo góc chuẩn:** `rounded-token` (10px) cho component mới; component cũ giữ `rounded-lg/xl`.
- **Đỏ thương hiệu:** `brand-red` (class) hoặc `var(--color-brand-red)`.

## Thang primary (teal)
50 `#f0fafa` · 100 `#d7f2f1` · 200 `#b0e6e4` · 300 `#82d4d2` · 400 `#5ec5c3` · **500 `#4abab9`** · 600 `#3a9897` · 700 `#327c7b` · 800 `#2d6362` · 900 `#295251` · 950 `#143130`

## Lưu ý
- Palette người dùng tự chọn (`types/category.ts`, `types/badge.ts`) **không** đổi — vẫn còn tuỳ chọn cam.
- Đổi `tailwind.config.js` / `index.html` cần **reload trang** (CDN nạp lúc load), không HMR như file `.tsx`.
