---
description: Scaffold một service CRUD Firestore mới đúng convention
argument-hint: "<Domain> [tên collection], vd Expense expenses"
---

Tạo file service mới `services/<domain>Service.ts` cho domain `$ARGUMENTS`.

Quy tắc (theo `.claude/rules/service-convention.md`):
- Tên file camelCase `<domain>Service.ts`. Tên collection lấy từ arg thứ 2, nếu không có thì suy ra số nhiều của domain (vd Expense → `expenses`), HỎI user xác nhận tên collection nếu không chắc.
- Khai báo `const COL = '<collection>';`, import `db` từ `@/config/firebase`.
- Import type `<Domain>` từ `@/types/<domain>` — nếu type chưa tồn tại, báo user và đề xuất chạy `/new-feature` thay vì tự bịa.
- Export riêng lẻ: `fetch<Domain>s` (map + type-guard từng field, `orderBy` hợp lý), `add<Domain>` (`Omit<T,'id'|'createdAt'>`, `Timestamp.now()`), `update<Domain>` (`Partial<Omit<T,'id'>>`), `delete<Domain>`.
- KHÔNG try/catch trong service.

Bám sát mẫu `services/expenseService.ts`. Sau khi tạo, in ra path file và tóm tắt các hàm đã export.
