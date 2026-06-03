# Quy ước Types

Khi tạo/sửa file trong `types/`:

- 1 file 1 domain (`expense.ts`, `order.ts`, `customer.ts`...). Export chung qua `types/index.ts` nếu cần.
- Dùng **union type** cho tập giá trị cố định thay enum string:
  `export type ExpenseCategory = 'rent' | 'utilities' | 'other';`
- Model dùng `interface` PascalCase, field optional bằng `?`. Ghi chú đơn vị/format bằng comment (vd `amount: number; // VND`, `date: string; // ISO yyyy-mm-dd`).
- Kèm **mảng constant** cho dropdown (SCREAMING_SNAKE_CASE):
  `export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [...]`
- Kèm **helper lookup label**: `export const expenseCategoryLabel = (c) => EXPENSE_CATEGORIES.find(...)?.label ?? 'Khác';`

Mẫu tham khảo: `types/expense.ts`.
