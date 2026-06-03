# Quy ước an toàn dữ liệu Firestore

- **Idempotency:** Webhook / handler ghi dữ liệu từ nguồn ngoài (vd `api/sepay/webhook.ts`) phải chống ghi trùng — kiểm tra bản ghi đã tồn tại (theo id giao dịch / mã đơn) trước khi `addDoc`.
- **Bắt lỗi ở caller:** Component gọi service phải bọc `try/catch` và báo lỗi bằng `react-hot-toast` (`toast.error(...)`), không để promise reject âm thầm.
- **Trạng thái loading:** Thao tác async (fetch/create/update) nên có cờ loading + spinner/skeleton, tránh UI đứng im.
- **Đọc dữ liệu:** Luôn type-guard dữ liệu Firestore thô (xem service-convention) — coi mọi field là untrusted.
- Tránh ghi trực tiếp Firestore trong component; đi qua service hoặc context.
