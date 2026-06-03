---
description: Scaffold trọn bộ types + service + page cho một feature mới
argument-hint: "<Domain>, vd Supplier"
---

Tạo trọn bộ feature cho domain `$ARGUMENTS` theo đúng convention, gồm 3 phần — làm tuần tự:

1. **Types** — `types/<domain>.ts` theo `.claude/rules/types-convention.md`:
   union type cho enum + `interface <Domain>` + mảng constant cho dropdown + helper `<x>Label()`.
   HỎI user các field chính của model nếu chưa rõ, đừng bịa.

2. **Service** — `services/<domain>Service.ts` theo `.claude/rules/service-convention.md`:
   `COL`, import `db` từ `@/config/firebase`, CRUD export riêng lẻ, type-guard khi đọc.
   HỎI/ xác nhận tên collection Firestore.

3. **Page** — `pages/<Domain>/index.tsx` theo `.claude/rules/page-structure.md` + `.claude/rules/ui-convention.md`:
   chỉ dùng `components/ui/`, tách `*ClassName`, lấy dữ liệu qua service/context.
   Đăng ký route + role trong `config/routes.ts`.

Mẫu tham khảo: `types/expense.ts`, `services/expenseService.ts`, `pages/Transactions/index.tsx`.

Cuối cùng chạy `python3 scripts/scan_html_tag.py pages/<Domain>` và `python3 scripts/scan_page_classname.py pages/<Domain>` — phải `all pass`. In tóm tắt 3 file đã tạo + route đã thêm.
