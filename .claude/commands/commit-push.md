---
description: Stage, commit (message tiếng Việt tự sinh) và push lên remote
argument-hint: "[mô tả commit, tùy chọn — bỏ trống để tự sinh]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git log:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*)
---

Commit và push các thay đổi hiện tại. Làm tuần tự:

1. Chạy `git status` và `git diff` (cả staged + unstaged) để xem có gì thay đổi.
   - Nếu KHÔNG có thay đổi nào → báo "không có gì để commit" và DỪNG.
2. `git add -A` để stage toàn bộ thay đổi.
3. Soạn commit message:
   - Nếu user có truyền `$ARGUMENTS` → dùng làm message.
   - Nếu trống → tự sinh message **tiếng Việt, ngắn gọn 1 dòng** mô tả đúng nội dung thay đổi (theo style commit gần đây của repo, vd "Tách & nâng cấp tính năng Hoa hồng").
4. `git commit` với message đó, kèm trailer:
   ```
   Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
   ```
5. `git push` lên branch hiện tại (`git push origin <branch-hiện-tại>`).
   - LƯU Ý: branch hiện tại thường là `production` và push sẽ kích hoạt deploy Vercel. Trước khi push, in rõ branch đang đứng + tóm tắt thay đổi để user biết đây là push thẳng lên production.
6. Báo kết quả: commit hash, message, branch đã push.

Không dùng `git rebase -i` / `git add -i` (không hỗ trợ).
