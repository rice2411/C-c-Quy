# Quy ước Service (tầng dữ liệu)

Khi tạo/sửa file trong `services/`:

- Đặt tên `<domain>Service.ts` (camelCase, vd `expenseService.ts`, `orderService.ts`).
- Khai báo tên collection 1 lần: `const COL = 'expenses';`.
- Import Firestore từ `@/config/firebase` (`db`) — KHÔNG khởi tạo Firebase trong service.
- Export từng hàm CRUD riêng lẻ (`fetchX`, `addX`, `updateX`, `deleteX`), không gom vào class.
- **Type guard khi đọc Firestore:** map `snap.docs` và kiểm tra `typeof` từng field trước khi gán, có giá trị mặc định an toàn (vd `typeof r.amount === 'number' ? r.amount : 0`). Không tin tưởng dữ liệu thô.
- Tham số ghi dùng `Omit<T, 'id' | 'createdAt'>` khi tạo, `Partial<Omit<T, 'id'>>` khi update.
- Dùng `Timestamp.now()` cho ngày tạo phía server.
- KHÔNG try/catch trong service — để caller (component) bắt lỗi + hiện toast.

Mẫu tham khảo: `services/expenseService.ts`, `services/revenueService.ts`.
