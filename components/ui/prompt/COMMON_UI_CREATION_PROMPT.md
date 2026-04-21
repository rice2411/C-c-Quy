# Common UI Creation Prompt

## Mục tiêu

Prompt này dùng để tạo mới hoặc mở rộng `common UI` trong `components/ui`, sau đó migrate tối thiểu một nơi dùng thật để chứng minh API đúng.

## Ngữ cảnh nên đính kèm

```text
@components/ui/UI_LIST.md
@components/ui/COMMON_UI_CREATION_PROMPT.md
@[component-đang-tạo-ví-dụ-components/ui/Button.tsx]
@[1-2-file-call-site-cần-migrate]
```

## Prompt mẫu

```text
Bạn là senior frontend engineer trong repo React + TypeScript + Tailwind.

Mục tiêu:
Tạo hoặc mở rộng [COMMON_UI_NAME] trong components/ui và migrate ít nhất 1 call site.

Ngữ cảnh:
@components/ui/UI_LIST.md
@components/ui/COMMON_UI_CREATION_PROMPT.md
@[component-đích-ví-dụ-components/ui/Button.tsx]
@[call-site-1]
@[call-site-2]

Yêu cầu:
1) Search trước khi code:
   - Tìm pattern UI hiện tại đang lặp (button/input/select/textarea/label/card/icon button/spinner/tabs...).
   - Xác nhận có thể reuse component common nào đã tồn tại.
2) Reuse-first:
   - Ưu tiên mở rộng common component đang có.
   - Chỉ tạo file common mới nếu chưa có component phù hợp.
3) Implement:
   - Type-safe props rõ ràng.
   - forwardRef nếu là native element.
   - Cho phép className override.
   - Không thêm thư viện UI mới.
4) Styling:
   - Giữ palette hiện tại (slate/orange/red), dark mode, focus ring nhất quán.
   - Tránh đổi behavior hoặc business logic.
5) Migrate:
   - Refactor tối thiểu 1 call site thực tế trong pages/components.
   - Ưu tiên thay đổi nhỏ nhất có thể.
6) Verify:
   - Chạy lint/check cho file vừa sửa.
7) Output bắt buộc:
   - Mapping: Current UI -> Common UI -> Status.
   - Danh sách file changed.
   - Ghi chú risk/regression (nếu có).
   - Các điểm chưa migrate và lý do.
```

## Ví dụ nhanh

```text
@components/ui/UI_LIST.md @components/ui/COMMON_UI_CREATION_PROMPT.md @components/ui/Input.tsx @pages/Orders/components/modals/CreateCustomerModal.tsx

Tạo Input common (nếu chưa có thì tạo mới, nếu đã có thì mở rộng API), sau đó migrate CreateCustomerModal để dùng Input này.
```

## Nguyên tắc bắt buộc

- Không chạy dev server.
- Không viết docs ngoài phạm vi khi chưa được yêu cầu.
- Không sửa logic nghiệp vụ nếu không cần thiết.
- Ưu tiên refactor incremental: mỗi lần 1 common UI + 1-2 call site.
