# Deploy Frontend (React + Vite) lên VPS — Hướng dẫn A→Z

FE build tĩnh (Vite → nginx) chạy trong Docker, sau nginx reverse-proxy + HTTPS.

```
Trình duyệt ── HTTPS ──▶ nginx (VPS) ──▶ container cucquy-frontend (127.0.0.1:8080, nginx serve dist)
                web.cucquy.site                    │ gọi API
                                                    ▼
                                          https://api.cucquy.site (BE)
```

**Thông số thực tế (đổi theo bạn):**
- VPS IP: `45.117.179.222`
- Domain FE: `web.cucquy.site` (subdomain; `cucquy.site` để Vercel làm backup)
- Domain BE: `api.cucquy.site`
- Thư mục VPS: `/root/cucquy/frontend`
- Repo: `https://github.com/rice2411/CucQuyBakery.git` (branch `production`)

> FE phụ thuộc cứng BE (không fallback) — BE phải chạy trước (`https://api.cucquy.site`).

---

## 1. DNS — trỏ subdomain FE về VPS

| Type | Name | Value |
|------|------|-------|
| A | `web` | `45.117.179.222` |

Kiểm tra (đợi tới khi ra IP — certbot sẽ fail nếu chưa trỏ):
```bash
dig +short web.cucquy.site @8.8.8.8      # → 45.117.179.222
```

---

## 2. Clone source (trên VPS)

```bash
mkdir -p /root/cucquy
cd /root/cucquy
git clone -b production https://github.com/rice2411/CucQuyBakery.git frontend
cd frontend
ls        # thấy Dockerfile, nginx.conf, vite.config.ts, src...
```

---

## 3. Đưa `.env.production` lên (build cần FIREBASE_* + VITE_API_URL)

`.env.production` bị gitignore (không có trong repo) → **scp từ MÁY LOCAL** (chú ý dấu `:` sau IP, không dán dấu `#`):
```bash
scp /duong/dan/local/frontend/.env.production root@45.117.179.222:/root/cucquy/frontend/
```
Nội dung `.env.production` (chỉ config client — KHÔNG có secret tích hợp):
```env
VITE_API_URL=https://api.cucquy.site/api
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_MEASUREMENT_ID=...
```
Kiểm tra trên VPS:
```bash
ls -la /root/cucquy/frontend/.env.production
```

---

## 4. Build image + chạy container

```bash
cd /root/cucquy/frontend
docker build --build-arg VITE_API_URL=https://api.cucquy.site/api -t cucquy-frontend .
docker run -d --name cucquy-frontend --restart unless-stopped -p 127.0.0.1:8080:80 cucquy-frontend
docker ps        # cucquy-frontend  Up  127.0.0.1:8080->80/tcp
```
Test nội bộ:
```bash
curl -s http://127.0.0.1:8080 | grep -o "<title>[^<]*</title>"
```

> Vite inline `VITE_API_URL` + `FIREBASE_*` vào bundle **lúc build**. Đổi env → phải build lại image.

---

## 5. Nginx + HTTPS

Tạo config bằng **nano** (tránh lỗi paste heredoc):
```bash
nano /etc/nginx/sites-available/web
```
```nginx
server {
    listen 80;
    server_name web.cucquy.site;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
ln -sf /etc/nginx/sites-available/web /etc/nginx/sites-enabled/web
nginx -t && systemctl reload nginx
certbot --nginx -d web.cucquy.site      # chọn 2 (redirect HTTP→HTTPS)
```
Test:
```bash
curl -sI https://web.cucquy.site | head -1      # HTTP/2 200
```

---

## 6. Bắt buộc — CORS + Firebase

**a) BE cho phép origin FE** (sửa trên VPS, ở thư mục backend):
```bash
nano /root/cucquy/backend/.env
#   ALLOWED_ORIGINS=https://web.cucquy.site,https://cucquy.site
cd /root/cucquy/backend
docker compose -f docker-compose.prod.yml up -d --force-recreate    # recreate để nạp .env mới (restart KHÔNG đủ)
```

**b) Firebase Authorized domains** → Firebase Console → Authentication → Settings → Authorized domains → thêm `web.cucquy.site` (nếu thiếu, Google login báo `auth/unauthorized-domain`).

---

## 7. Test cuối
Mở `https://web.cucquy.site` → đăng nhập Google → vào Dashboard/đơn hàng/hoa hồng (data qua `api.cucquy.site`).

---

## 8. Cập nhật code sau này

```bash
cd /root/cucquy/frontend
git pull origin production
docker build --build-arg VITE_API_URL=https://api.cucquy.site/api -t cucquy-frontend .
docker stop cucquy-frontend && docker rm cucquy-frontend
docker run -d --name cucquy-frontend --restart unless-stopped -p 127.0.0.1:8080:80 cucquy-frontend
docker image prune -f
```

---

## 9. Lỗi thường gặp (đã gặp khi deploy)

**certbot `NXDOMAIN looking up A for web.cucquy.site`** → DNS chưa trỏ / chưa lan. Kiểm `dig +short web.cucquy.site @8.8.8.8` ra IP rồi mới chạy lại certbot.

**`http://web.cucquy.site` không lên HTTPS** → chưa chạy certbot thành công, hoặc chưa chọn redirect. Chạy `certbot --nginx -d web.cucquy.site` (chọn 2).

**CORS: `No 'Access-Control-Allow-Origin' header`** → `ALLOWED_ORIGINS` ở BE thiếu `https://web.cucquy.site`, HOẶC đã sửa `.env` nhưng chỉ `restart` (không nạp env mới). Phải `docker compose ... up -d --force-recreate` ở backend.

**Login báo `auth/unauthorized-domain`** → chưa thêm `web.cucquy.site` vào Firebase Authorized domains.

**App trắng / gọi API sai chỗ** → image build thiếu `VITE_API_URL` hoặc `.env.production` chưa lên VPS lúc build. Kiểm bundle: `curl -s https://web.cucquy.site/assets/index-*.js | grep -o api.cucquy.site/api`.

**scp `No such file or directory`** → thiếu dấu `:` sau IP, hoặc dán nhầm dấu `#`. Đúng: `... root@45.117.179.222:/root/cucquy/frontend/`.

---

## Ghi chú
- `.env.production` chỉ ở VPS, không commit (gitignored). Là config client (Firebase web config vốn public) — KHÔNG chứa secret tích hợp (Gemini/Vision/SerpApi/Zalo/SePay đã ở BE).
- Container bind `127.0.0.1:8080` → ra ngoài qua nginx HTTPS, không phơi port trần.
- SSL Let's Encrypt miễn phí, tự gia hạn (`certbot renew --dry-run` để kiểm).
