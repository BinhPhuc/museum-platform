# Nginx origin cho Cloudflare Tunnel

Cấu hình [tram-van.conf](tram-van.conf) dành cho `cloudflared` chạy trực tiếp trên cùng VPS với Nginx và truy cập `http://127.0.0.1:80`. Nginx phục vụ HTTP nội bộ; HTTPS ở phía người dùng do Cloudflare xử lý. Cấu hình không có chứng chỉ, chuyển hướng HTTPS hay HSTS.

## Bố trí file

```text
/var/www/tram-van/
├── app/         # Nội dung dist-app/
└── memories/    # Nội dung public/memories/
```

- `/` mở ứng dụng; `index.html`, background và favicon dùng `Cache-Control: no-cache` để trình duyệt kiểm tra phiên bản mới.
- `/assets/` dùng cache một năm với `immutable` vì tên file do Vite sinh có hash.
- `/memories/` dùng cache một giờ, ETag và Last-Modified; phục vụ trực tiếp từ đĩa, có byte range cho video/PDF, không gzip.
- File thiếu và đường dẫn ẩn trả `404` cùng `Cache-Control: no-store`. Ứng dụng hiện không có router theo đường dẫn, nên URL không tồn tại không được chuyển về `index.html`.
- JS/CSS và PDF worker được gzip; `.mjs` có MIME `application/javascript`. Không cần cài thêm module Brotli vào Nginx.
- CSP cho phép ảnh nhúng DOCX, phông chữ PDF, worker cùng origin và style nội tuyến mà bộ đọc cần. Không mở `unsafe-eval` cho JavaScript.

`add_header` được đặt ở cấp `server` để các location giữ đủ header bảo vệ; không thêm `add_header` riêng trong location nếu chưa xử lý kế thừa. Tham khảo [quy tắc kế thừa header của Nginx](https://nginx.org/en/docs/http/ngx_http_headers_module.html) và [gzip module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html).

## Cài lên VPS

Ví dụ cho Nginx được cài bằng package Linux, đã include `/etc/nginx/conf.d/*.conf` bên trong `http {}`. Cần bản Nginx có module `http_realip` (`nginx -V`); các package phổ biến và image Nginx chính thức có module này.

1. Build giao diện:

   ```bash
   npm ci
   npm run build:app
   ```

2. Copy giao diện và nội dung lên VPS. Các lệnh dưới chạy từ thư mục dự án trên VPS; nếu build ở máy khác, chuyển hai thư mục này bằng rsync/scp trước:

   ```bash
   sudo install -d -m 755 /var/www/tram-van/app /var/www/tram-van/memories
   sudo rsync -a --chmod=D755,F644 dist-app/ /var/www/tram-van/app/
   sudo rsync -a --chmod=D755,F644 public/memories/ /var/www/tram-van/memories/
   ```

   Khi cập nhật giao diện, chỉ cần copy lại `dist-app/`. Không dùng `--delete` nếu còn cần các bundle hash cũ cho tab đang mở. Media được cập nhật riêng; nếu thay nội dung cùng URL, cache trình duyệt có thể giữ bản cũ tối đa một giờ. Đổi tên file và cập nhật `treeData` khi cần phát hành ngay.

3. Thay `tram-van.example.com` trong file cấu hình bằng hostname thực tế rồi cài:

   ```bash
   sudo install -m 644 deploy/nginx/tram-van.conf /etc/nginx/conf.d/tram-van.conf
   sudoedit /etc/nginx/conf.d/tram-van.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```

   Đây là cấu hình được include trong `http {}`, không thay thế toàn bộ `/etc/nginx/nginx.conf`. Giữ các virtual host đang chạy cho ứng dụng khác. Không include cùng file hai lần qua cả `conf.d` và `sites-enabled`.

   Nếu VPS đang có các virtual host dùng `listen 80` (wildcard), thống nhất cách khai báo listener trước khi thêm site này: Nginx chọn địa chỉ/cổng trước khi xét hostname. Một listener riêng `127.0.0.1:80` có thể làm thay đổi cách các hostname cũ được xử lý trên loopback. Các site cùng đi qua `cloudflared` nên dùng cùng listener loopback; kiểm tra lại từng hostname sau khi reload.

   Nếu hệ thống bật SELinux, đặt context cho `/var/www/tram-van` phù hợp với nội dung Nginx được phép đọc (thường là `httpd_sys_content_t`); không tắt SELinux để xử lý quyền truy cập.

## Cloudflare Tunnel

Trong Published application/Public hostname của tunnel đang có:

- Hostname: domain thực tế của TRẠM VĂN.
- Service type: **HTTP**.
- URL: **127.0.0.1:80**.
- HTTP Host Header: hostname giống `server_name` trong Nginx, đặc biệt khi VPS còn nhiều website.

Nếu quản lý tunnel bằng YAML, thêm ingress tương ứng vào cấu hình đang dùng, giữ nguyên tunnel ID và credentials hiện có:

```yaml
ingress:
  - hostname: tram-van.example.com
    service: http://127.0.0.1:80
    originRequest:
      httpHostHeader: tram-van.example.com
  - service: http_status:404
```

Chỉ tin `CF-Connecting-IP` từ connector trên `127.0.0.1`/`::1`; không tin header từ mọi IP. Log có IP người dùng ở đầu dòng, `peer=` là IP connector và `cf_ray=` để đối chiếu Cloudflare. Cách dùng header này dựa trên [tài liệu Cloudflare](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip) và [Nginx realip module](https://nginx.org/en/docs/http/ngx_http_realip_module.html).

Nếu `cloudflared` chạy trong container khác hoặc trên máy khác, loopback sẽ không trỏ về cùng máy/network namespace. Khi đó đổi địa chỉ `listen`, URL service và `set_real_ip_from` sang địa chỉ nội bộ chính xác của hai dịch vụ; chỉ cho connector truy cập origin.

Để Cloudflare giữ chính sách cache này, tránh Cache Rule ép cache HTML hoặc ghi đè TTL origin cho mọi đường dẫn. Cấu hình Nginx không thay đổi các thiết lập Cloudflare hiện có.

## Kiểm tra trên VPS

```bash
# HTML: 200, Cache-Control: no-cache
curl -sSI -H 'Host: tram-van.example.com' http://127.0.0.1/

# Video: 206, Content-Range: bytes 0-1023/...
curl -sS -D - -o /dev/null \
  -H 'Host: tram-van.example.com' \
  -H 'Range: bytes=0-1023' \
  http://127.0.0.1/memories/BacHoDocBanTNDL/BacHo.mp4

# File thiếu: 404, Cache-Control: no-store
curl -sSI -H 'Host: tram-van.example.com' \
  http://127.0.0.1/memories/missing.pdf
```

Kiểm tra gzip bằng GET đến một file JS thật trong `/assets/`, gửi `Accept-Encoding: gzip`. Kết quả có `Content-Encoding: gzip` và `Vary: Accept-Encoding`. HEAD không phải phép đo lượng dữ liệu nén.

Cấu hình đã được kiểm tra trong container Nginx 1.30.8: syntax, cache 200/304, gzip, MIME worker, Unicode DOCX, byte range 206, 404 và CSP với nội dung thực tế.

## Chạy lại kiểm thử tích hợp cục bộ

Sau khi có `dist-app/`, có thể dùng Podman để kiểm tra trên cổng **18080**, không đụng cổng 80 đang chạy của máy:

```bash
npm run build:app
sed 's/127\.0\.0\.1:80/127.0.0.1:18080/g; s/\[::1\]:80/[::1]:18080/g' \
  deploy/nginx/tram-van.conf > /tmp/tram-van-nginx-check.conf

podman run --rm -d --name tram-van-nginx-check \
  --network host --security-opt label=disable \
  -v /tmp/tram-van-nginx-check.conf:/etc/nginx/conf.d/default.conf:ro \
  -v "$PWD/dist-app:/var/www/tram-van/app:ro" \
  -v "$PWD/public/memories:/var/www/tram-van/memories:ro" \
  docker.io/library/nginx:stable-alpine

podman exec tram-van-nginx-check nginx -t
NGINX_TEST_URL=http://127.0.0.1:18080 npm run test:nginx
podman stop tram-van-nginx-check
```

`--security-opt label=disable` chỉ dành cho container kiểm thử cục bộ với mount chỉ đọc, để không thay đổi SELinux label của repository. Production vẫn dùng quyền/context đúng của web root.
