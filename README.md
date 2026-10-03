# VidAI Studio

**Công cụ AI tạo video & ảnh cá nhân** — Motion Copy · Image to Video · AI Thay Trang Phục

---

## Tính năng

| Tính năng | Mô tả | AI Provider |
|-----------|-------|-------------|
| 🕺 Motion Copy | Upload ảnh nhân vật + video mẫu → video chuyển động | Replicate / Kling |
| 🎬 Image to Video | Upload ảnh + prompt → video sống động | Replicate / Runway |
| 👗 AI Thay Trang Phục | Upload người mẫu + trang phục → ảnh mặc trang phục mới | Replicate (IDM-VTON) |

---

## Yêu cầu hệ thống

- Node.js ≥ 18.x
- npm ≥ 9.x
- (VPS) Ubuntu 22.04, 2GB RAM tối thiểu

---

## Cài đặt Development

```bash
# 1. Clone repo
git clone https://github.com/your-username/vidai-studio.git
cd vidai-studio

# 2. Cài dependencies
npm install

# 3. Setup thư mục và .env
node scripts/setup.js

# 4. Điền API keys vào .env.local
# (xem mục "Cấu hình API Keys" bên dưới)

# 5. Chạy Next.js (terminal 1)
npm run dev

# 6. Chạy background worker (terminal 2)
npm run worker

# Truy cập: http://localhost:3000
```

---

## Cấu hình API Keys

Chỉnh sửa file `.env.local`:

### 1. Replicate (bắt buộc cho demo nhanh)
- Đăng ký: https://replicate.com
- Lấy API token: https://replicate.com/account/api-tokens
- Điền: `REPLICATE_API_TOKEN=r8_xxxx...`

### 2. Kling AI (tuỳ chọn — chất lượng motion copy tốt hơn)
- Đăng ký: https://klingai.com/dev
- Điền: `KLING_ACCESS_KEY` và `KLING_SECRET_KEY`
- Đổi provider: `AI_PROVIDER_MOTION_COPY=kling`

### 3. RunwayML (tuỳ chọn — image to video chất lượng cao)
- Đăng ký: https://app.runwayml.com
- Lấy key: https://app.runwayml.com/settings
- Điền: `RUNWAYML_API_SECRET=...`
- Đổi provider: `AI_PROVIDER_IMAGE_TO_VIDEO=runway`

---

## Models Replicate mặc định

| Tính năng | Model | Replicate Page |
|-----------|-------|----------------|
| Image to Video | `stability-ai/stable-video-diffusion` | https://replicate.com/stability-ai/stable-video-diffusion |
| Clothes Change | `cuuupid/idm-vton` | https://replicate.com/cuuupid/idm-vton |
| Motion Copy | `lucataco/animate-anyone` | https://replicate.com/lucataco/animate-anyone |

> **Tip:** Thay đổi model qua biến môi trường `REPLICATE_MODEL_*` trong `.env.local`

---

## Cấu trúc thư mục

```
vidai-studio/
├── src/
│   ├── app/                      # Next.js App Router pages + API
│   │   ├── page.tsx              # Trang chủ dashboard
│   │   ├── motion-copy/          # Trang Motion Copy
│   │   ├── image-to-video/       # Trang Image to Video
│   │   ├── clothes-change/       # Trang Thay Trang Phục
│   │   ├── history/              # Lịch sử jobs
│   │   └── api/
│   │       ├── upload/           # API upload file
│   │       ├── jobs/             # API lấy job status
│   │       ├── generate/         # API tạo job AI
│   │       └── files/            # API serve files
│   ├── components/               # React components
│   └── lib/
│       ├── db.ts                 # SQLite database
│       ├── storage.ts            # File storage helpers
│       └── providers/            # AI provider abstraction
│           ├── base.ts           # Interface chung
│           ├── replicate.ts      # Replicate provider
│           ├── kling.ts          # Kling AI provider
│           └── runway.ts         # RunwayML provider
├── worker/
│   └── index.js                  # Background job worker (PM2 process)
├── data/                         # Runtime data (git-ignored)
│   ├── uploads/                  # Files upload từ user
│   ├── results/                  # Kết quả AI
│   └── db/vidai.db               # SQLite database
├── scripts/setup.js              # First-time setup script
├── ecosystem.config.js           # PM2 config
├── nginx.conf                    # Nginx reverse proxy config
└── .env.example                  # Mẫu config
```

---

## Deploy lên Hostinger VPS

### Bước 1 — Chuẩn bị VPS (Ubuntu 22.04)

```bash
# SSH vào VPS
ssh root@your.server.ip

# Cài Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Cài PM2 và Nginx
npm install -g pm2
apt-get install -y nginx

# Tạo thư mục deploy
mkdir -p /var/www/vidai-studio
```

### Bước 2 — Clone và cài đặt

```bash
cd /var/www/vidai-studio
git clone https://github.com/your-username/vidai-studio.git .
npm install

# Setup thư mục data
node scripts/setup.js

# Điền API keys
nano .env.local
```

### Bước 3 — Build và khởi động

```bash
# Build Next.js
npm run build

# Khởi động với PM2
pm2 start ecosystem.config.js

# PM2 tự khởi động khi reboot
pm2 save
pm2 startup
# Chạy lệnh mà pm2 startup in ra
```

### Bước 4 — Cấu hình Nginx

```bash
# Copy nginx config
cp /var/www/vidai-studio/nginx.conf /etc/nginx/sites-available/vidai-studio

# Sửa server_name thành domain thực của bạn
nano /etc/nginx/sites-available/vidai-studio

# Enable site
ln -s /etc/nginx/sites-available/vidai-studio /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Xoá default

# Test và reload
nginx -t
systemctl reload nginx
```

### Bước 5 — SSL (Let's Encrypt, khuyến nghị)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Sau đó bỏ comment phần HTTPS trong nginx.conf
```

### Bước 6 — Kiểm tra

```bash
pm2 status         # Xem trạng thái processes
pm2 logs           # Xem logs
pm2 logs vidai-worker  # Logs worker riêng
```

---

## Update code (CI/CD đơn giản)

```bash
cd /var/www/vidai-studio
git pull
npm install
npm run build
pm2 restart vidai-web
# Worker không cần restart khi chỉ thay code Next.js
```

---

## API Documentation

### POST `/api/upload`
Upload file ảnh hoặc video.

**Request:** `multipart/form-data` với field `file`

**Response:**
```json
{ "id": "uuid", "url": "/api/files/upload/uuid.jpg", "filename": "uuid.jpg", "type": "image/jpeg", "size": 12345 }
```

---

### POST `/api/generate/motion-copy`
Tạo job Motion Copy.

**Request:**
```json
{ "characterImageUrl": "/api/files/upload/...", "motionVideoUrl": "/api/files/upload/...", "prompt": "optional" }
```

**Response:** `202 Accepted`
```json
{ "id": "job-uuid", "status": "pending" }
```

---

### POST `/api/generate/image-to-video`
**Request:**
```json
{ "imageUrl": "...", "prompt": "cô gái nhảy múa...", "duration": 5 }
```

---

### POST `/api/generate/clothes-change`
**Request:**
```json
{ "modelImageUrl": "...", "garmentImageUrl": "..." }
```

---

### GET `/api/jobs/:id`
Lấy trạng thái job theo ID.

**Response:**
```json
{
  "id": "...", "type": "image-to-video", "status": "completed",
  "progress": 100, "output_url": "/api/files/result/uuid.mp4",
  "created_at": "...", "completed_at": "..."
}
```

---

### GET `/api/jobs?limit=50&offset=0`
Lấy danh sách tất cả jobs.

---

### GET `/api/files/{type}/{filename}`
Lấy file upload hoặc kết quả. `type` là `upload` hoặc `result`.

---

## Thêm AI Provider mới

1. Tạo file `src/lib/providers/your-provider.ts` extend `BaseProvider`
2. Implement 4 methods: `motionCopy`, `imageToVideo`, `clothesChange`, `pollResult`
3. Đăng ký trong `src/lib/providers/index.ts`
4. Đặt `AI_PROVIDER_*=your-provider` trong `.env.local`

---

## Troubleshooting

**Worker không xử lý jobs:**
```bash
pm2 logs vidai-worker --lines 50
# Kiểm tra REPLICATE_API_TOKEN có đúng không
```

**Upload lỗi "File quá lớn":**
- Tăng `MAX_FILE_SIZE_MB` trong `.env.local`
- Cập nhật `client_max_body_size` trong `nginx.conf`

**Jobs bị stuck ở "processing":**
- Worker tự reset jobs stuck khi khởi động lại
- `pm2 restart vidai-worker`

---

## License

MIT — Tự do sử dụng, không được copy logo hoặc tài sản của bên thứ ba.
