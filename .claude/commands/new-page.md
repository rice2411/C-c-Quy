---
description: Scaffold một page mới đúng convention (folder + index.tsx + route)
argument-hint: "<TênPage>, vd Suppliers"
---

Tạo page mới `pages/<TênPage>/index.tsx` cho `$ARGUMENTS`.

Quy tắc (theo `.claude/rules/page-structure.md` + `.claude/rules/ui-convention.md`):
- Folder PascalCase + `index.tsx`. Export `const <TênPage>Page: React.FC = () => {...}` rồi `export default`.
- Thứ tự trong component: state → memo → handler → render.
- Wrapper ngoài cùng `Box layoutClassName="flex h-full flex-col space-y-4"`, header có icon lucide + `Typography`/`Heading`.
- CHỈ dùng component trong `components/ui/`, tách `*ClassName`, không thẻ HTML thô.
- Lấy dữ liệu qua context (`useAuth`/`useOrders`/`useLanguage`...) — không gọi Firebase trực tiếp.
- Đăng ký route + phân quyền trong `config/routes.ts`. HỎI user role nào được truy cập nếu không rõ.

Bám sát mẫu `pages/Transactions/index.tsx`. Sau khi tạo, chạy `python3 scripts/scan_html_tag.py pages/<TênPage>` và `python3 scripts/scan_page_classname.py pages/<TênPage>` — cả hai phải `all pass`. In path file + dòng route đã thêm.
