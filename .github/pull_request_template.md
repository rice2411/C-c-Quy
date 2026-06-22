<!--
  PR chuẩn CucQuy. BẮT BUỘC: Evidence TRƯỚC + SAU (xem mục Evidence).
  PR promote (staging→production, →develop) hoặc gắn nhãn `skip-evidence` được bỏ qua kiểm tra.
-->

## Làm gì
<!-- Tóm tắt thay đổi -->

Closes #<!-- số issue -->

## Phạm vi
<!-- Liệt kê file:dòng đụng tới; đánh dấu chỗ KHÔNG sửa -->

## 📸 Evidence TRƯỚC & SAU (BẮT BUỘC)
<!--
  UI → ảnh BEFORE + AFTER (kéo-thả lên GitHub hoặc raw URL từ branch `evidences`):
       bảng before|after, mỗi vị trí 1 cặp nếu nhiều chỗ.
  BE/SQL/refactor → code/SQL/`git diff` TRƯỚC & SAU (+ kết quả chạy).
  KHÔNG ghi "đã có evidence" suông — phải có ảnh/code thật.
-->

| Before | After |
|---|---|
| <!-- ![before](...) hoặc ```trước``` --> | <!-- ![after](...) hoặc ```sau``` --> |

## Verify
- [ ] tsc/build pass
- [ ] scan UI `all pass` (nếu FE) / test pass (nếu BE)
- [ ] Hành vi đúng acceptance của issue
