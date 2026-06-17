#!/usr/bin/env bash
#
# deploy.sh — Build local (Colima, buildx, linux/amd64) → push GHCR → tự rollout k3s.
#
# VPS là x86_64 (amd64) nên BẮT BUỘC build --platform linux/amd64 (máy Mac arm64).
# Deploy chủ động bằng kubectl set image (không phụ thuộc keel poll).
#
# Dùng:
#   ./deploy.sh              # build amd64 + push :latest và :<sha> → rollout deploy/frontend
#   ./deploy.sh --no-latest  # CHỈ build + push :<sha> (KHÔNG rollout). Dùng test.
#
# Creds GHCR: GHCR_TOKEN (PAT write:packages) hoặc `gh auth token`; GHCR_USER tuỳ chọn.
#
set -euo pipefail

IMAGE="ghcr.io/cucquy/cucquy-frontend"
VITE_API_URL="https://api.cucquy.site/api"
VPS="rice@ssh.ricevps.xyz"
NS="cucquy"; DEPLOY="frontend"
DEPLOY_DIR="~/deploys/cucquy-frontend"
BUILDER="cucquy-xbuild"

PUSH_LATEST=1
for arg in "$@"; do
  case "$arg" in
    --no-latest) PUSH_LATEST=0 ;;
    -h|--help)   sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "❌ Tham số lạ: $arg" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")"
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

# 1. Docker / buildx builder
docker info >/dev/null 2>&1 || { red "❌ Docker (Colima) chưa chạy. colima start"; exit 1; }
docker buildx inspect "$BUILDER" >/dev/null 2>&1 || {
  blue "→ tạo buildx builder $BUILDER (docker-container)..."
  docker buildx create --name "$BUILDER" --driver docker-container --bootstrap >/dev/null
}
green "✓ Docker + buildx OK"

# 2. Gate type-check (vite build KHÔNG check type)
[ -d node_modules ] || { blue "→ npm ci..."; npm ci; }
blue "→ tsc --noEmit..."; npx tsc --noEmit; green "✓ Type-check pass"

# 3. Commit
SHA="$(git rev-parse --short HEAD)"; FULL_SHA="$(git rev-parse HEAD)"
MSG="$(git log -1 --pretty=format:'%s')"; AUTHOR="$(git log -1 --pretty=format:'%an')"
TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
blue "→ Commit: $SHA  ($MSG)"

# 4. Login GHCR
GHCR_USER="${GHCR_USER:-$(git config user.name 2>/dev/null | tr '[:upper:] ' '[:lower:]_')}"; GHCR_USER="${GHCR_USER:-cucquy}"
TOKEN="${GHCR_TOKEN:-}"; [ -z "$TOKEN" ] && command -v gh >/dev/null 2>&1 && TOKEN="$(gh auth token 2>/dev/null || true)"
[ -n "$TOKEN" ] || { red "❌ Không có GHCR creds. export GHCR_TOKEN=<PAT write:packages> hoặc gh auth login"; exit 1; }
echo "$TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null && green "✓ Login GHCR OK (user: $GHCR_USER)"

# 5. Build + push (linux/amd64, buildx push thẳng)
TAGS=(-t "$IMAGE:$SHA"); [ "$PUSH_LATEST" -eq 1 ] && TAGS+=(-t "$IMAGE:latest")
blue "→ buildx build --platform linux/amd64 --push (VITE_API_URL=$VITE_API_URL)..."
docker buildx build --builder "$BUILDER" --platform linux/amd64 \
  --build-arg VITE_API_URL="$VITE_API_URL" "${TAGS[@]}" --push .
green "✓ Build + push OK (linux/amd64)"

# 6. Record lên VPS (cho dashboard RiceVPSManager)
KIND="deploy"; [ "$PUSH_LATEST" -eq 1 ] || KIND="test"
RECORD=$(printf '{"commit":"%s","short":"%s","message":%s,"author":%s,"time":"%s","image":"%s:%s","status":"pushed","kind":"%s"}' \
  "$FULL_SHA" "$SHA" \
  "$(printf '%s' "$MSG" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$(printf '%s' "$AUTHOR" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$TIME" "$IMAGE" "$SHA" "$KIND")
printf '%s\n' "$RECORD" | ssh -o ConnectTimeout=10 "$VPS" "mkdir -p $DEPLOY_DIR && cat >> $DEPLOY_DIR/history.jsonl" \
  && green "✓ Record ($KIND) → $DEPLOY_DIR/history.jsonl" || red "⚠ Không ghi được record (push vẫn OK)."

# 7. Rollout chủ động (option 1 — không phụ thuộc keel): pin deploy về tag :<sha> vừa build
echo
if [ "$PUSH_LATEST" -eq 1 ]; then
  blue "→ kubectl set image deploy/$DEPLOY → :$SHA + rollout..."
  ssh -o ConnectTimeout=15 "$VPS" "export KUBECONFIG=\$HOME/.kube/config
    CN=\$(kubectl -n $NS get deploy $DEPLOY -o jsonpath='{.spec.template.spec.containers[0].name}')
    kubectl -n $NS set image deploy/$DEPLOY \"\$CN=$IMAGE:$SHA\"
    kubectl -n $NS rollout status deploy/$DEPLOY --timeout=300s"
  green "🚀 Đã rollout deploy/$DEPLOY → $IMAGE:$SHA (linux/amd64)"
else
  green "🧪 Đã push CHỈ :$SHA (KHÔNG rollout). Prod giữ nguyên."
fi
