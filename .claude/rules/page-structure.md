# Quy ước cấu trúc Page

Khi tạo/sửa page trong `pages/`:

- Mỗi page là 1 folder PascalCase chứa `index.tsx` (vd `pages/Transactions/index.tsx`).
- Component con / tab / modal của page đặt trong `./components` (relative import trong cùng feature là OK).
- Export `const XPage: React.FC = () => {...}` rồi `export default`.
- Thứ tự trong component: (1) state `useState` → (2) tính toán memo `useMemo/useCallback` → (3) handler → (4) render.
- Lấy dữ liệu/dùng dùng chung qua context, KHÔNG gọi Firebase trực tiếp trong page:
  `useAuth()`, `useOrders()`, `useCustomers()`, `useLanguage()`...
- Wrapper ngoài cùng dùng `Box layoutClassName="flex h-full flex-col ..."`.
- Đăng ký route + phân quyền trong `config/routes.ts` (role-based).
- Tuân thủ UI styling convention (xem rule ui-convention): chỉ dùng component `components/ui/`, tách `*ClassName`.

Mẫu tham khảo: `pages/Transactions/index.tsx`.
