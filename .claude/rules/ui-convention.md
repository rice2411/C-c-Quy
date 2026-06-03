# Quy tắc bắt buộc khi implement UI

Khi viết hoặc sửa bất kỳ UI nào (file `.tsx`/`.jsx`), LUÔN tuân thủ:

## 1. Dùng component UI dùng chung — KHÔNG dùng thẻ HTML thô
- Mọi UI phải dùng component trong `components/ui/`, không được dùng thẻ HTML thô.
- Mapping thẻ → component (xem `scripts/ui_tag_mapping.json`):
  - `<div>` → `Box`
  - `<p>` / `<span>` → `Typography`
  - `<h1..h6>` → `Heading`
  - `<button>` → `Button` (hoặc `IconButton`)
  - `<input>` → `Input`, `type="checkbox"` → `Checkbox`, `type="radio"` → dùng component tương ứng
  - `<select>` → `Select`, `<textarea>` → `Textarea`, `<label>` → `Label`
  - `<img>` → `Image` / `AvatarImage`
  - `<table><thead><tbody><tr><td><th>` → `Table`
  - `<ul>/<ol>/<li>/<a>` → component UI tương ứng (Box/Typography...)
- **Ngoại lệ:** icon lucide (vd `DollarSign`, `Save`) vẫn dùng `className` vì không phải component UI dùng chung.

## 2. KHÔNG truyền `className=` gộp trên component UI
- Trên các component UI dùng chung, KHÔNG được dùng một `className` gộp nhiều nhóm.
- Phải tách thành các prop riêng theo ngữ nghĩa:
  `layoutClassName`, `sizeClassName`, `backgroundClassName`, `textClassName`,
  `borderClassName`, `roundedClassName`, `shadowClassName`, `stateClassName`,
  `hoverClassName`, `focusClassName`, `containerClassName`, `iconClassName`...

## 3. Khi cần tạo cái mới — CONFIRM trước
- Nếu cần một component/prop chưa có (vd thay `<span animate-spin>` bằng `ButtonSpinner`),
  hoặc không chắc dùng component/prop nào, thì **đọc trong `scripts/` để hiểu quy ước** trước,
  rồi **hỏi xác nhận với user** trước khi tạo. Không tự ý tạo bừa.
- Tham khảo các component đã có trong `components/ui/` để theo đúng phong cách (cấu trúc prop `*ClassName`).

## 4. Tự kiểm tra sau khi sửa
Sau khi sửa một page/component, chạy 2 script và cả hai phải in `all pass`:

```bash
python3 scripts/scan_html_tag.py <path>        # cấm thẻ HTML thô
python3 scripts/scan_page_classname.py <path>  # cấm className gộp trên UI component
```

`<path>` có thể là tên ngắn (vd `Transactions`), đường dẫn folder (`pages/Transactions`)
hoặc file cụ thể. Lệnh mẫu ở `scripts/cmd.txt`.
Dùng `scan_page_classname.py <path> --split-only` để chỉ xem các dòng `className` trộn ≥2 nhóm ngữ nghĩa.
