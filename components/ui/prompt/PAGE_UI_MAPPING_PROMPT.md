# Page UI Mapping Prompt

## Mục tiêu

Prompt này dùng để refactor một page cụ thể theo hướng tái sử dụng `components/ui` (common UI). Input chính là URL/page path (ví dụ: `pages/Login`).

## Cách dùng nhanh

Trong Cursor chat, truyền ngữ cảnh bằng `@`:

```text
@components/ui/UI_LIST.md
@components/ui/REFACTOR_PROMPT.md
@components/ui/PAGE_UI_MAPPING_PROMPT.md
@pages/Login
```

Sau đó dán prompt mẫu bên dưới.

## Prompt mẫu

```text
Bạn là senior frontend engineer trong repo React + TypeScript + Tailwind.

Input page: [PAGE_PATH_OR_URL]
Ví dụ: pages/Login

Ngữ cảnh:
@components/ui/UI_LIST.md
@components/ui/REFACTOR_PROMPT.md
@components/ui/PAGE_UI_MAPPING_PROMPT.md
@[PAGE_PATH_OR_URL]

Yêu cầu thực hiện:
1) Quét toàn bộ UI item trong page input (bao gồm file con được page đó import trực tiếp).
2) Lập mapping từ UI hiện tại sang common UI trong components/ui:
   - button -> Button
   - input -> Input
   - select -> Select
   - textarea -> Textarea
   - label -> Label
   - field wrapper -> Field
   - icon-only button -> IconButton
   - checkbox/radio -> Checkbox (nếu phù hợp)
   - badge/chip -> Badge
   - spinner/loading inline -> Spinner
   - card container -> Card
   - tab header -> Tabs
   - p/span/h1..h6 -> Typography (nếu chưa có thì đề xuất tạo)
   - img -> Avatar/Image
   - a -> LinkText hoặc Link component chung
   - ul/ol/li -> List primitives (nếu có)
   - table/thead/tbody/tr/td/th -> Table primitives (nếu có)
3) Refactor page theo mapping với thay đổi nhỏ nhất có thể, không đổi business logic.
4) Nếu thiếu common UI hoặc common hiện tại chưa cover case thực tế:
   - Ưu tiên mở rộng component common hiện có.
   - Chỉ tạo common mới khi thật sự cần thiết.
   - Mô tả rõ lý do và API mới/được mở rộng.
5) Sau khi sửa code:
   - Liệt kê bảng mapping trước/sau.
   - Nêu file đã đổi.
   - Nêu các điểm chưa thể migrate (nếu có) và lý do.
6) Không thêm thư viện UI mới. Không chạy dev server.
7) Chạy lint/check phù hợp nếu có script.
8) Ưu tiên detect và xử lý thêm các raw HTML tag sau: `p`, `span`, `img`, `a`, `h1..h6`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `td`, `th`.

Output mong muốn:
- Mapping table (Current UI -> Common UI -> Status).
- Danh sách file changed.
- Ghi chú rủi ro hồi quy UI (nếu có).
```

## Ví dụ dùng cho `pages/Login`

```text
@components/ui/UI_LIST.md @components/ui/REFACTOR_PROMPT.md @components/ui/PAGE_UI_MAPPING_PROMPT.md @pages/Login

Refactor toàn bộ UI trong pages/Login sang common UI. Nếu thiếu common component để cover login flow, hãy cập nhật common component trước rồi mới migrate page.
```
