# Page Param Class Refactor Prompt

## Mục tiêu

Prompt này dùng để refactor một page theo kiến trúc `param class` cho common UI (thay vì dồn tất cả vào `className`).

Ưu tiên:
- Tái sử dụng common UI hiện có.
- Tách class đúng semantic param (`layoutClassName`, `backgroundClassName`, `textClassName`, `borderClassName`, `roundedClassName`, `shadowClassName`, `hoverClassName`, `stateClassName`, `focusClassName`, `sizeClassName`, ...).
- Giữ thay đổi nhỏ nhất, không đổi business logic.

## Cách dùng nhanh

```text
@components/ui/prompt/UI_LIST.md
@components/ui/prompt/PAGE_UI_MAPPING_PROMPT.md
@components/ui/prompt/PAGE_PARAM_CLASS_REFACTOR_PROMPT.md
@[PAGE_PATH]
```

Ví dụ:

```text
@components/ui/prompt/UI_LIST.md @components/ui/prompt/PAGE_UI_MAPPING_PROMPT.md @components/ui/prompt/PAGE_PARAM_CLASS_REFACTOR_PROMPT.md @pages/Login
```

## Prompt mẫu

```text
Bạn là senior frontend engineer trong repo React + TypeScript + Tailwind.

Input page: [PAGE_PATH]
Ví dụ: pages/Login

Ngữ cảnh:
@components/ui/prompt/UI_LIST.md
@components/ui/prompt/PAGE_UI_MAPPING_PROMPT.md
@components/ui/prompt/PAGE_PARAM_CLASS_REFACTOR_PROMPT.md
@[PAGE_PATH]

Yêu cầu bắt buộc:
1) Search-first trong codebase để xác nhận pattern param class hiện tại của từng common UI (Button, Card, IconButton, Box, Input, Select, Textarea, Typography, AvatarImage...).
2) Refactor page theo hướng param hóa class, KHÔNG dồn style vào một `className` dài nếu đã có param semantic tương ứng.
3) Mapping class theo đúng ý nghĩa:
   - Layout/position/spacing -> `layoutClassName` (hoặc `sizeClassName` nếu thuộc kích thước control)
   - Background -> `backgroundClassName`
   - Text color/typography -> `textClassName`
   - Border -> `borderClassName`
   - Radius -> `roundedClassName`
   - Shadow -> `shadowClassName`
   - Hover -> `hoverClassName`
   - Focus ring/outline -> `focusClassName`
   - Active/disabled/interactive states -> `stateClassName`
   - Kích thước control (padding/height/width theo control) -> `sizeClassName`
4) Chỉ giữ `className` cho:
   - Các class không có param semantic tương ứng, hoặc
   - class đặc thù ngắn gọn chưa đáng mở rộng API.
5) Nếu common UI chưa có param cần thiết:
   - Ưu tiên mở rộng component common hiện có (nhỏ, tương thích ngược).
   - Không tạo component mới nếu không cần.
6) Không đổi logic nghiệp vụ, không đổi data flow, không đổi behavior ngoài phạm vi style API.
7) Không thêm thư viện UI mới. Không chạy dev server.
8) Sau refactor phải chạy lint/check phù hợp.

Tiêu chí hoàn thành:
- UI giữ nguyên hành vi.
- Class rõ nghĩa theo param.
- Override từ ngoài hoạt động ổn định.
- Diff gọn, dễ review.

Output bắt buộc:
- Bảng mapping trước/sau cho từng chỗ refactor (Old className -> New param structure).
- Danh sách file đã đổi.
- Những chỗ còn giữ `className` và lý do.
- Rủi ro hồi quy UI (nếu có) + cách verify nhanh.
```

## Checklist review nhanh

- Có chỗ nào vẫn nhồi quá nhiều thứ vào `className` dù đã có param chưa?
- `hover:*`, `focus:*`, `active:*` đã nằm đúng param trạng thái chưa?
- Màu chữ/nền có bị trộn sai (`text` nằm trong `backgroundClassName` hoặc ngược lại) không?
- Có giữ backward compatibility cho common UI khi mở rộng API không?
