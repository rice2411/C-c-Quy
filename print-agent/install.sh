#!/usr/bin/env bash
# Cài cầu nối in CucQuy trên máy Mac CÓ CẮM máy in nhiệt Xprinter.
#   - cucquy-print-agent : nhận ESC/POS từ admin → lp -o raw ra máy in (LaunchAgent).
#   - fix-xprinter       : khi CẮM máy in, tự khớp URI USB (serial rác đổi mỗi lần) + xoá queue chết + bật queue.
# Chạy:  bash install.sh
#   KHÔNG cần sudo nếu user thuộc nhóm _lpadmin (tài khoản admin macOS mặc định có).
#
# TRƯỚC KHI CHẠY: thêm máy in Xprinter 1 lần qua  System Settings ▸ Printers & Scanners ▸ Add
# (chọn driver bất kỳ / Generic — mình in raw nên driver không quan trọng).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UIDN="$(id -u)"
LA="$HOME/Library/LaunchAgents"
APP="$HOME/.cucquy"
mkdir -p "$APP" "$LA"

if ! id -Gn | tr ' ' '\n' | grep -qx _lpadmin; then
  echo "⚠️  User không thuộc _lpadmin — phần tự-khớp URI có thể cần sudo. (In vẫn chạy được.)"
fi
# Dùng Perl (LUÔN có sẵn trên macOS) — KHÔNG dùng python3 (macOS chỉ có stub, cần Xcode CLT mới chạy).
command -v /usr/bin/perl >/dev/null || echo "⚠️  Lạ: máy này không có /usr/bin/perl?"

# 1) print agent (Perl)
cp "$DIR/agent.pl" "$APP/agent.pl"
cat > "$LA/site.cucquy.printagent.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>site.cucquy.printagent</string>
<key>ProgramArguments</key><array><string>/usr/bin/perl</string><string>$APP/agent.pl</string></array>
<key>EnvironmentVariables</key><dict><key>LC_ALL</key><string>C</string><key>LANG</key><string>C</string></dict>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardErrorPath</key><string>/tmp/cucquy-printagent.log</string>
<key>StandardOutPath</key><string>/tmp/cucquy-printagent.log</string>
</dict></plist>
PL

# 2) fix-xprinter: khớp URI USB — CHẠY KHI CẮM MÁY IN (LaunchEvents IOKit), KHÔNG timer.
#    (lpinfo enumerate USB làm máy Xprinter reset → offline; nên chỉ chạy 1 lần lúc cắm.)
cat > "$APP/fix-xprinter.sh" <<'SH'
#!/bin/bash
# Khớp queue với máy Xprinter ĐANG cắm + XOÁ queue chết. Chạy lúc cắm USB (không định kỳ:
# lpinfo enumerate USB làm máy reset → offline; ở đây chỉ chạy 1 lần lúc thiết bị vừa gắn).
# Vì serial USB máy Xprinter là rác, đổi mỗi lần cắm → macOS đẻ queue MỚI (đổi tên+location)
# và bỏ queue cũ chết. Nếu để queue cũ lại, agent/print có thể gửi nhầm vào nó → "ngoại tuyến".
# Giải pháp: giữ DUY NHẤT 1 queue trỏ đúng thiết bị sống, xoá phần còn lại.
export PATH=/usr/bin:/bin:/usr/sbin:/sbin
sleep 3   # chờ thiết bị ổn định sau khi cắm
U=$(lpinfo -v 2>/dev/null | awk '/usb:\/\/Xprinter/{print $2; exit}')   # URI thiết bị THỰC đang cắm
[ -z "$U" ] && exit 0
QS=$(lpstat -v 2>/dev/null | grep 'usb://Xprinter' | sed -E 's/.* ([^ ]+): usb.*/\1/')  # mọi queue Xprinter
LIVE=""
for P in $QS; do
  CUR=$(lpstat -v "$P" 2>/dev/null | sed 's/.*: //')
  [ "$CUR" = "$U" ] && LIVE="$P"
done
if [ -z "$LIVE" ]; then                       # không queue nào khớp → re-point queue đầu sang URI sống
  LIVE=$(printf '%s\n' $QS | head -1)
  [ -n "$LIVE" ] && lpadmin -p "$LIVE" -v "$U" 2>/dev/null
fi
[ -z "$LIVE" ] && exit 0
for P in $QS; do [ "$P" != "$LIVE" ] && lpadmin -x "$P" 2>/dev/null; done   # xoá queue chết còn lại
# abort-job: USB chớp/rớt giữa job → HỦY job đó nhưng KHÔNG pause queue (mặc định stop-printer
# làm queue "bị tắt" → các lần in sau kẹt/nhả rác). Lần in kế cứ chạy, người dùng in lại là xong.
lpadmin -p "$LIVE" -o printer-error-policy=abort-job 2>/dev/null
cupsenable "$LIVE" 2>/dev/null; cupsaccept "$LIVE" 2>/dev/null
exit 0
SH
chmod +x "$APP/fix-xprinter.sh"
cat > "$LA/site.cucquy.xprinterattach.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>site.cucquy.xprinterattach</string>
<key>ProgramArguments</key><array><string>/bin/bash</string><string>$APP/fix-xprinter.sh</string></array>
<key>LaunchEvents</key><dict>
  <key>com.apple.iokit.matching</key><dict>
    <key>site.cucquy.xprinter-usb</key><dict>
      <key>IOProviderClass</key><string>IOUSBHostDevice</string>
      <key>idVendor</key><integer>1155</integer>
    </dict>
  </dict>
</dict>
<key>StandardErrorPath</key><string>/tmp/cucquy-xprinterattach.log</string>
</dict></plist>
PL

# chạy fix 1 lần ngay lúc cài (khớp URI hiện tại)
bash "$APP/fix-xprinter.sh" || true

for L in printagent xprinterattach; do
  launchctl bootout "gui/$UIDN/site.cucquy.$L" 2>/dev/null || true
  launchctl bootstrap "gui/$UIDN" "$LA/site.cucquy.$L.plist"
done

sleep 2
echo "=== kiểm tra agent ==="
curl -s --max-time 5 http://127.0.0.1:9110/ping && echo || echo "(agent chưa phản hồi — xem /tmp/cucquy-printagent.log)"
echo "✅ Cài xong. Mỗi lần cắm máy in sẽ tự khớp queue + xoá queue chết; admin in qua http://127.0.0.1:9110."
