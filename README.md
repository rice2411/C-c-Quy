# CucQuy Bakery Management

![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![API](https://img.shields.io/badge/API-NestJS%20%2B%20Postgres-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![SePay Webhook](https://img.shields.io/badge/Payment-SePay%20Webhook-ff6b35?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge)

## 1) Tổng quan

Đây là dự án quản lý vận hành tiệm bánh Cúc Quỳ, bao gồm các module như đơn hàng, khách hàng, kho, nhà cung cấp, người dùng, dashboard, notifications và đồng bộ giao dịch thanh toán qua SePay webhook.

Stack chính:
- `React 19` + `TypeScript` + `Vite`
- Dữ liệu qua REST API (BE NestJS + Postgres); auth SSO RiceService
- `Tailwind CSS` + hệ thống common UI tại `components/ui`
- Deploy: build image → GHCR → keel (admin.cucquy.site)

## 2) Cấu trúc dự án

```text
CucQuyBakery/
├─ api/                      # Serverless API (VD: SePay webhook)
│  └─ sepay/webhook.ts
├─ pages/                    # Màn hình theo feature
│  ├─ Dashboard/
│  ├─ Orders/
│  ├─ Customers/
│  ├─ Transactions/
│  ├─ Users/
│  └─ ...
├─ components/
│  ├─ ui/                    # Common UI (Button, Input, Card, Badge, Table...)
│  └─ ...
├─ services/                 # Logic gọi BE REST API, business services
├─ config/                   # Cấu hình runtime (queryClient, routes...)
├─ contexts/                 # React contexts
├─ types/                    # Type models
├─ utils/                    # Helpers tiện ích
├─ scripts/                  # Script scan/check nội bộ
├─ vercel.json               # Rewrite + headers cho deploy Vercel
└─ vite.config.ts            # Build config + inject env
```

## 3) Setup môi trường local

### Yêu cầu
- `Node.js` 18+ (khuyến nghị LTS)
- `npm`

### Cài đặt
1. Cài dependency:
   ```bash
   npm install
   ```
2. Tạo file `.env.local` ở root dự án:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
   > Secret tích hợp (Gemini/Vision/SerpApi/Zalo/SePay) đã chuyển hết về BE — FE chỉ cần `VITE_API_URL`.
3. Chạy local:
   ```bash
   npm run dev
   ```
4. Build production:
   ```bash
   npm run build
   ```

## 4) API thanh toán (SePay Webhook)

Endpoint: `POST /api/sepay/webhook`  
File xử lý: `api/sepay/webhook.ts`

### Luồng xử lý hiện tại
1. Nhận webhook payload từ SePay.
2. Validate payload cơ bản (`id` bắt buộc).
3. Đọc `VITE_API_URL` từ env runtime (Vite inline lúc build).
4. Lưu bản ghi giao dịch vào collection `transactions`.
5. Trích xuất `orderNumber` từ `description` theo pattern `ORDxxxx` -> format thành `ORD-xxxx`.
6. Tìm đơn hàng trong collection `orders` theo `orderNumber`.
7. Nếu tìm thấy: update đơn hàng:
   - `paymentStatus = "PAID"`
   - `sepayId = webhookData.id`
8. Trả response thành công/thất bại.

### Lưu ý kỹ thuật
- `vercel.json` đã có rewrite cho `/api/*` để route về `api/*`.
- Webhook hiện dùng `addDoc` trực tiếp, chưa có cơ chế chống duplicate idempotent theo `sepayId`.
- Nếu webhook gọi lặp, có thể tạo nhiều record ở `transactions` (cần cân nhắc bổ sung check unique theo `sepayId`).

## 5) Deploy

- Nền tảng: `Vercel`
- Build command: `npm run build`
- Output directory: `dist`
- Rewrite SPA + API đã cấu hình trong `vercel.json`

## 6) Scripts chính

- `npm run dev`: chạy local
- `npm run build`: build production
- `npm run preview`: preview bản build

## 7) Gợi ý kiểm tra nhanh sau setup

- Đăng nhập được (SSO), đọc/ghi dữ liệu qua BE ổn định.
- Tạo đơn hàng có `orderNumber` đúng format.
- Gửi test webhook SePay và xác nhận:
  - có transaction mới trong `transactions`
  - order tương ứng được cập nhật `paymentStatus = PAID`.
