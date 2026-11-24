# Museum · Ký ức

Bảo tàng ký ức bằng React + Vite, phát triển độc lập từ `BinhPhuc/reading-platform`. Người dùng duyệt chủ đề và xem video, ảnh, DOCX, PDF trong trình duyệt.

## Chạy dự án

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

Kiểm thử trình duyệt (cài Chromium lần đầu):

```bash
npx playwright install chromium
npm run test:browser
```

Hoặc dùng Chrome có sẵn: `CHROMIUM_PATH=/duong/dan/chrome npm run test:browser`.

## Thêm ký ức

Đặt file trực tiếp trong `public/memories/<chu-de>/`, sau đó thêm vào `children` của một chủ đề trong `src/data/memories.js`:

```js
{
  id: "gia-dinh",
  name: "Gia đình",
  children: [
    { id: "gd-1", name: "Ngày sum họp", file: "/memories/gia-dinh/sum-hop.mp4", description: "Tết bên gia đình", poster: "/memories/gia-dinh/poster.jpg" },
    { id: "gd-2", name: "Ảnh kỷ niệm", file: "/memories/gia-dinh/ky-niem.jpg", alt: "Cả nhà bên hiên nhà" },
    { id: "gd-3", name: "Chuyện ngày xưa", file: "/memories/gia-dinh/chuyen.docx" },
    { id: "gd-4", name: "Nhật ký", file: "/memories/gia-dinh/nhat-ky.pdf" },
  ],
}
```

`id` phải duy nhất. `description`, `poster`, `alt` là tùy chọn. Đường dẫn URL không có tiền tố `public/`. Tên file phân biệt chữ hoa/thường trên Linux. Đây là danh mục khai báo trong mã nguồn; ứng dụng không tự quét thư mục hoặc cung cấp trang upload. Cập nhật danh mục xong cần build lại.

Nội dung mẫu và danh mục sách cũ đã được xóa. File phục vụ kiểm thử nằm trong `tests/fixtures/`, không đưa vào bản build.

## Định dạng

- Video: `.mp4`, `.webm`, `.ogv`; có điều khiển phát, tua, âm lượng, toàn màn hình tùy trình duyệt; không tự phát. Khả năng phát phụ thuộc codec: ưu tiên MP4 H.264/AAC cho nội dung thực tế.
- Ảnh: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.bmp`; giữ tỉ lệ gốc trong vùng xem.
- DOCX: chuyển nội dung sang HTML bằng [Mammoth](https://github.com/mwilliamson/mammoth.js) và làm sạch bằng [DOMPurify](https://github.com/cure53/DOMPurify), hoàn toàn trong trình duyệt. Hiển thị văn bản, tiêu đề, danh sách, bảng, ảnh nhúng; không đảm bảo bố cục trang, phông chữ, header/footer giống Word. `.doc` không được hỗ trợ. Có nút tải bản gốc.
- PDF: đọc trực tiếp trong trình duyệt, cuộn nhiều trang, hiển thị số trang và tải bản gốc. PDF worker được đóng gói và phục vụ từ cùng server.
- Định dạng khác (bao gồm EPUB): thông báo chưa hỗ trợ và cho tải file gốc.

## Triển khai file tĩnh

`npm run build` tạo `dist/` gồm ứng dụng và file từ `public/`. Phục vụ thư mục này bằng Nginx, Caddy hoặc web server hiện có; không cần database, S3 hay dịch vụ xem tài liệu ngoài. Các URL trong dự án mặc định chạy ở gốc domain.

Để chỉ build giao diện và tránh sao chép video/tài liệu mỗi lần triển khai:

```bash
npm run build:app
```

Lệnh này tạo `dist-app/` gồm JS/CSS, PDF worker, background và favicon. Copy nội dung `dist-app/` vào `/var/www/tram-van/app/`; copy `public/memories/` vào `/var/www/tram-van/memories/` trên cùng server.

Cấu hình HTTP cổng 80 cho Cloudflare Tunnel, cache, gzip, MIME và byte range nằm tại [deploy/nginx/tram-van.conf](deploy/nginx/tram-van.conf). Xem [hướng dẫn triển khai Nginx](deploy/nginx/README.md) để cài cấu hình và chạy kiểm thử.

Phải phục vụ cả `/memories/` khi dùng `dist-app/`; thư mục này không chứa các file nội dung. `npm run build` vẫn tạo bản đầy đủ, tự chứa mọi file để triển khai như trước.

Với bộ sưu tập lớn, có thể mount thư mục media trên cùng server tại URL `/memories/` thay vì đưa toàn bộ vào từng bản build. Giữ media khi triển khai lại ứng dụng. Cấu hình đúng MIME type (đặc biệt `video/mp4`, `video/webm`) và HTTP Range (`206 Partial Content`) để tua video hiệu quả. Nginx/Caddy phục vụ file tĩnh có hỗ trợ Range; tránh cấu hình SPA fallback trả `index.html` cho file media bị thiếu (nên trả 404).

Mọi file ở vùng tĩnh đều truy cập được qua URL. Cách triển khai hiện tại phù hợp bộ sưu tập công khai, không có kiểm soát truy cập.

## Background

Prompt theo chủ đề **Tự hào truyền thống núi sông** nằm tại [docs/background-prompt.md](docs/background-prompt.md). Ảnh nền hiện tại được nén WebP tại `public/bg.webp`, giữ nguyên kích thước và bố cục.

Tài liệu hiện hành là README này và `AGENTS.md`.
