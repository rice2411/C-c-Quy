# Vì sao config Tailwind + CSS tokens phải nằm trong `public/`

Tài liệu này giải thích cho team lý do `tailwind.config.js` và `tokens.css` của CucQuy frontend
**bắt buộc** đặt trong `public/`, không để ở thư mục nguồn. Đây là tài liệu để hiểu, không phải để chạy.

## Bối cảnh

App dùng **Tailwind Play CDN** (`https://cdn.tailwindcss.com`), **KHÔNG** có `tailwindcss`/`postcss`
trong build — stack chỉ là **Vite + React**. Tailwind được cấu hình lúc runtime trong trình duyệt
qua biến global `tailwind.config = {...}`.

Design system gồm 2 file nạp trực tiếp trong `index.html`:

- `tailwind.config.js` — nạp bằng `<script>` (thang màu `primary` teal `#4abab9`, radius, font).
- `tokens.css` — nạp bằng `<link>` (biến CSS dùng cho chart / style inline).

Cả hai đều được trình duyệt nạp **verbatim** (nguyên bản), không qua bước `import` nào trong code.

## Triệu chứng (lỗi ban đầu)

Khi đặt 2 file ở thư mục nguồn `frontend/styles/`, chạy dev server thì:

- `tokens.css` bị Vite biến thành **JS module** — response chứa `import { createHotContext } from "/@vite/client"`
  thay vì CSS thuần → style không áp dụng.
- `tailwind.config.js` có lúc bị **SPA fallback** trả về nội dung `index.html` → trình duyệt nhận
  `<!DOCTYPE html>` thay vì JS và báo:

  ```
  Uncaught SyntaxError: Unexpected token '<'
  ```

## Nguyên nhân gốc

Vite dev server **"đụng tay" vào mọi file trong thư mục nguồn**: nó đẩy file qua module graph,
transform, inject HMR client, và áp SPA fallback cho route không khớp. Điều đó đúng cho file được
`import` trong code, nhưng **sai** với file ta muốn trình duyệt nạp nguyên bản bằng `<script>`/`<link>`.

Thư mục `public/` thì ngược lại: Vite phục vụ file **y nguyên** — đúng MIME, không transform.

| Hành vi của Vite          | Thư mục nguồn (`styles/`)                          | `public/`                          |
| ------------------------- | -------------------------------------------------- | ---------------------------------- |
| Đi qua module graph       | Có                                                 | Không                              |
| Transform / HMR inject    | Có (`.css` → JS module có `createHotContext`)      | Không                              |
| SPA fallback              | Có (request không khớp → trả `index.html`)         | Không                              |
| Content-Type              | Bị đổi (CSS → `text/javascript`)                   | Đúng (`text/css`, `text/javascript`) |
| Nạp verbatim qua `<link>`/`<script>` | Hỏng                                    | Chạy đúng                          |

## Cách sửa

1. Chuyển 2 file vào `frontend/public/styles/`.
2. Đổi `index.html` sang **đường dẫn tuyệt đối**:
   - `/styles/tailwind.config.js`
   - `/styles/tokens.css`
3. Xoá file chết `frontend/tailwind.config.ts` ở root — không ai nạp (dùng CDN, mà `.ts` không serve
   được ra browser).

Đã verify bằng `curl`: content-type đúng, không còn wrapper `createHotContext`.

## Cấu trúc cuối

```
frontend/
├── index.html              # nạp các file dưới bằng <link>/<script>
├── styles.css              # base: font Inter, scrollbar, fix input iOS — vẫn ở root, nạp qua <link>
└── public/
    └── styles/
        ├── tailwind.config.js   # <script> → set global tailwind.config
        ├── tokens.css           # <link>   → biến CSS cho chart/inline
        └── README.md
```

Luồng nạp trong trình duyệt:

```
index.html
   │  <link href="/styles.css">              ──► base styles (verbatim từ root, OK)
   │  <link href="/styles/tokens.css">       ──► tokens CSS  (verbatim từ public/)
   │  <script src="https://cdn.tailwindcss.com">  ──► Tailwind Play CDN
   └─ <script src="/styles/tailwind.config.js">   ──► set window.tailwind.config (verbatim từ public/)
```

## Quy tắc rút gọn

> **File được nạp verbatim bằng `<script>`/`<link>` (đường dẫn tuyệt đối) → PHẢI nằm trong `public/`.**
> **File được `import` trong code (đi qua bundler) → để ở thư mục nguồn.**

Hệ quả: `tailwind.config.js` + `tokens.css` ở `public/` vì trình duyệt nạp trực tiếp;
component `.tsx`, CSS được `import` trong React thì để ở nguồn cho Vite xử lý.
