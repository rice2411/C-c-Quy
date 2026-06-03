---
description: Kiểm tra UI convention (thẻ HTML thô + className gộp) trên path chỉ định
argument-hint: "[path | tên page, vd Transactions hoặc pages/Orders]"
allowed-tools: Bash(python3 scripts/scan_html_tag.py:*), Bash(python3 scripts/scan_page_classname.py:*)
---

Chạy 2 script kiểm tra UI convention trên target `$ARGUMENTS` (nếu trống, hỏi user nhập path hoặc tên page):

```bash
python3 scripts/scan_html_tag.py $ARGUMENTS
python3 scripts/scan_page_classname.py $ARGUMENTS
```

Sau đó báo cáo gọn:
- Cả hai in `all pass` → báo ĐẠT.
- Có dòng vi phạm → liệt kê `file:line` + thẻ/component vi phạm, kèm cách sửa theo `scripts/ui_tag_mapping.json` (thẻ HTML thô → component UI; `className` gộp → tách thành các prop `*ClassName`).
- Chạy thêm `python3 scripts/scan_page_classname.py $ARGUMENTS --split-only` nếu cần xem dòng `className` trộn ≥2 nhóm ngữ nghĩa.

Không tự ý sửa file trừ khi user yêu cầu — mặc định chỉ báo cáo.
