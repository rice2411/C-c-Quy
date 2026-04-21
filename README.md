# CucQuy Bakery Management

![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![SePay Webhook](https://img.shields.io/badge/Payment-SePay%20Webhook-ff6b35?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge)

## 1) Tổng quan

Đây là dự án quản lý vận hành tiệm bánh Cúc Quỳ, bao gồm các module như đơn hàng, khách hàng, kho, nhà cung cấp, người dùng, dashboard, notifications và đồng bộ giao dịch thanh toán qua SePay webhook.

Stack chính:
- `React 19` + `TypeScript` + `Vite`
- `Firebase` (Firestore, Auth, Storage)
- `Tailwind CSS` + hệ thống common UI tại `components/ui`
- API route serverless tại `api/` (triển khai trên Vercel)

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
├─ services/                 # Logic gọi Firebase/API, business services
├─ config/                   # Cấu hình runtime (Firebase...)
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
   GEMINI_API_KEY=

   FIREBASE_API_KEY=
   FIREBASE_AUTH_DOMAIN=
   FIREBASE_PROJECT_ID=
   FIREBASE_STORAGE_BUCKET=
   FIREBASE_MESSAGING_SENDER_ID=
   FIREBASE_APP_ID=
   FIREBASE_MEASUREMENT_ID=

   ZALO_SHOP_CODE=
   ZALO_TOKEN=
   ZALO_URL=
   ```
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
3. Khởi tạo Firebase bằng env runtime.
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

- Đăng nhập được, đọc/ghi dữ liệu Firebase ổn định.
- Tạo đơn hàng có `orderNumber` đúng format.
- Gửi test webhook SePay và xác nhận:
  - có transaction mới trong `transactions`
  - order tương ứng được cập nhật `paymentStatus = PAID`.
