# cucquy-print-agent — cầu nối in bill/phiếu bếp (máy in nhiệt 58mm)

Máy in nhiệt 58mm (SingPC Print-211 / Xprinter) **không in thẳng từ trình duyệt** trên macOS mới
(macOS bỏ driver CUPS → `window.print()` gửi PostScript, máy nhiệt chỉ hiểu ESC/POS → in trắng + nhả giấy).

Giải pháp: **cầu nối local** viết bằng **Perl** (`/usr/bin/perl` có sẵn mọi máy Mac — KHÔNG dùng Python vì
macOS không bundle python3 thật). Admin (FE) render bill/phiếu bếp → ESC/POS raster → gửi
`http://127.0.0.1:9110` → agent `lp -o raw` ra máy in (bỏ qua driver), tự cắt.

## Cài trên máy Mac có cắm máy in (làm 1 LẦN — sau đó tự chạy mãi)

1. Thêm máy in: **System Settings ▸ Printers & Scanners ▸ Add** (driver bất kỳ/Generic — không quan trọng vì in raw).
2. Copy thư mục `print-agent/` sang máy đó rồi chạy:
   ```bash
   bash install.sh
   ```
   Không cần sudo nếu tài khoản là admin (nhóm `_lpadmin`). Thấy `cucquy-print-agent ok; printer=...` là xong.
3. (Nên) Bật **auto-login** để mở máy là agent tự chạy không cần đăng nhập tay:
   **System Settings ▸ Users & Groups ▸ Automatic login**.

> Cài 1 lần = đăng ký LaunchAgent với macOS → **tắt/mở máy bao nhiêu lần cũng tự chạy, KHÔNG cần chạy lại script.**

## Nó cài gì (đều LaunchAgent cấp user, tự chạy lại khi đăng nhập)
- `~/.cucquy/agent.pl` + `site.cucquy.printagent` — cầu nối nghe `127.0.0.1:9110` (RunAtLoad + KeepAlive).
  Trước mỗi lần in: **đợi máy in có mặt trên USB** (máy hay tự ngắt ~5s khi in mảng đen — tự về được) +
  **dọn job kẹt** → ra rác chỉ cần bấm In lại, khỏi rút–cắm USB.
- `~/.cucquy/fix-xprinter.sh` + `site.cucquy.xprinterattach` — chạy **khi CẮM USB máy in**
  (LaunchEvents IOKit vendor 1155, KHÔNG polling): khớp URI thiết bị thực + **xoá queue chết** (giữ 1 queue
  sống) + `error-policy=abort-job` (1 tờ lỗi không kẹt dây chuyền) + bật queue.
  ⚠️ KHÔNG dùng timer `lpinfo` định kỳ: `lpinfo` enumerate USB làm máy Xprinter reset → offline.

## Kiểm tra / gỡ
```bash
curl http://127.0.0.1:9110/ping                 # xem agent + máy in dò được
launchctl bootout gui/$(id -u)/site.cucquy.printagent
launchctl bootout gui/$(id -u)/site.cucquy.xprinterattach
rm ~/Library/LaunchAgents/site.cucquy.*.plist ~/.cucquy/agent.pl ~/.cucquy/fix-xprinter.sh
```

## Lưu ý
- Dùng **Chrome** ở máy shop (cho phép trang https gọi `http://127.0.0.1`). Safari có thể chặn.
- Agent chỉ nghe `127.0.0.1` (không mở ra mạng ngoài) — an toàn.
- Máy in nhiệt kéo dòng → cắm USB tốt (nhiễu điện lúc in mảng đen có thể làm rớt USB; ổn định nhất là
  cáp USB-C→USB-B cắm thẳng Mac + cục ferrite, tránh hub yếu).
