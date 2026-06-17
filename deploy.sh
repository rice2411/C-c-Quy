#!/usr/bin/env bash
#
# deploy.sh — Build local (Colima/docker) → push GHCR → keel tự rollout trên k3s.
#
# Thay cho GitHub Actions cũ. VPS KHÔNG build (RAM 1.4GB, không có docker).
# Image: ghcr.io/cucquy/cucquy-frontend  (keel poll :latest mỗi ~1' → rollout deploy/frontend ns cucquy)
#
# Dùng:
#   ./deploy.sh              # build + push :latest và :<sha>  → keel rollout prod
#   ./deploy.sh --no-latest  # CHỈ build + push :<sha> (KHÔNG đụng :latest → KHÔNG kích rollout). Dùng test pipeline.
#
# Creds GHCR:
#   GHCR_TOKEN  (bắt buộc nếu không có `gh auth token`)  — PAT có scope write:packages
#   GHCR_USER   (mặc định: git user.name slugified hoặc 'cucquy')
#
set -euo pipefail

# ── Cấu hình ──
IMAGE="ghcr.io/cucquy/cucquy-frontend"
VITE_API_URL="https://api.cucquy.site/api"
VPS="rice@ssh.ricevps.xyz"
DEPLOY_DIR="~/deploys/cucquy-frontend"

PUSH_LATEST=1
for arg in "$@"; do
  case "$arg" in
    --no-latest) PUSH_LATEST=0 ;;
    -h|--help)   sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "❌ Tham số lạ: $arg" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

# ── 1. Docker / Colima chạy chưa? ──
if ! docker info >/dev/null 2>&1; then
  red "❌ Docker daemon không phản hồi (Colima chưa chạy?)."
  echo "   Khởi động Colima:  colima start"
  echo "   Rồi chạy lại:      ./deploy.sh ${*:-}"
  exit 1
fi
green "✓ Docker OK"

# ── 2. Gate chất lượng (thay CI cũ) ──
if [ ! -d node_modules ]; then
  blue "→ node_modules chưa có, chạy npm ci..."
  npm ci
else
  blue "✓ node_modules sẵn — bỏ qua npm ci"
fi
blue "→ Type-check (tsc --noEmit)..."
npx tsc --noEmit
green "✓ Type-check pass"

# ── 3. Thông tin commit ──
SHA="$(git rev-parse --short HEAD)"
FULL_SHA="$(git rev-parse HEAD)"
MSG="$(git log -1 --pretty=format:'%s')"
AUTHOR="$(git log -1 --pretty=format:'%an')"
TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
blue "→ Commit: $SHA  ($MSG)"

# ── 4. Login GHCR ──
GHCR_USER="${GHCR_USER:-$(git config user.name 2>/dev/null | tr '[:upper:] ' '[:lower:]_')}"
GHCR_USER="${GHCR_USER:-cucquy}"
TOKEN="${GHCR_TOKEN:-}"
if [ -z "$TOKEN" ] && command -v gh >/dev/null 2>&1; then
  TOKEN="$(gh auth token 2>/dev/null || true)"
fi
if [ -z "$TOKEN" ]; then
  red "❌ Không có GHCR credentials."
  echo "   Cung cấp 1 trong 2:"
  echo "     export GHCR_TOKEN=<PAT có scope write:packages>   (và tuỳ chọn GHCR_USER=<github-username>)"
  echo "     hoặc đăng nhập gh:  gh auth login   (cần scope write:packages)"
  exit 1
fi
blue "→ docker login ghcr.io (user: $GHCR_USER)..."
echo "$TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
green "✓ Login GHCR OK"

# ── 5. Build ──
TAGS=(-t "$IMAGE:$SHA")
if [ "$PUSH_LATEST" -eq 1 ]; then TAGS+=(-t "$IMAGE:latest"); fi
blue "→ docker build (VITE_API_URL=$VITE_API_URL)..."
docker build --build-arg VITE_API_URL="$VITE_API_URL" "${TAGS[@]}" .
green "✓ Build OK"

# ── 6. Push ──
blue "→ docker push $IMAGE:$SHA"
docker push "$IMAGE:$SHA"
if [ "$PUSH_LATEST" -eq 1 ]; then
  blue "→ docker push $IMAGE:latest"
  docker push "$IMAGE:latest"
fi
green "✓ Push OK"

# ── 7. Ghi record deploy lên VPS (contract cho dashboard) ──
KIND="deploy"
[ "$PUSH_LATEST" -eq 1 ] || KIND="test"
RECORD=$(printf '{"commit":"%s","short":"%s","message":%s,"author":%s,"time":"%s","image":"%s:%s","status":"pushed","kind":"%s"}' \
  "$FULL_SHA" "$SHA" \
  "$(printf '%s' "$MSG" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$(printf '%s' "$AUTHOR" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$TIME" "$IMAGE" "$SHA" "$KIND")
blue "→ Ghi record deploy lên VPS..."
if printf '%s\n' "$RECORD" | ssh -o ConnectTimeout=10 "$VPS" "mkdir -p $DEPLOY_DIR && cat >> $DEPLOY_DIR/history.jsonl"; then
  green "✓ Đã ghi record ($KIND) vào $DEPLOY_DIR/history.jsonl"
else
  red "⚠ Không ghi được record lên VPS (push image vẫn OK)."
fi

# ── 8. Kết ──
echo
if [ "$PUSH_LATEST" -eq 1 ]; then
  green "🚀 Đã push :latest và :$SHA. Keel sẽ rollout deploy/frontend trong ~1 phút."
  echo "   Xem rollout:  ssh $VPS kubectl -n cucquy rollout status deploy/frontend"
else
  green "🧪 Đã push CHỈ :$SHA (KHÔNG đụng :latest). Keel sẽ KHÔNG rollout — prod giữ nguyên."
fi
