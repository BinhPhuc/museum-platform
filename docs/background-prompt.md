# Prompt background: Tự hào truyền thống núi sông

Ảnh nền cho TRẠM VĂN, bộ sưu tập gồm Nam quốc sơn hà, Bình Ngô đại cáo, Tuyên ngôn Độc lập năm 1945, video Bác Hồ đọc Tuyên ngôn Độc lập, tiểu sử Lý Thường Kiệt và tư liệu báo chí.

## Prompt

> Create an elegant background artwork for a Vietnamese digital heritage archive titled “TỰ HÀO TRUYỀN THỐNG NÚI SÔNG”, celebrating national independence, cultural memory, and the enduring spirit of Vietnam. The website presents Nam Quoc Son Ha, Binh Ngo Dai Cao, the 1945 Declaration of Independence, archival footage of Ho Chi Minh, the life of Ly Thuong Kiet, and historical press coverage. Express this continuity through a restrained, poetic landscape rather than a literal collage of documents or portraits. Across the lower third, show layered Vietnamese mountains fading into mist, a winding river, and a small traditional pavilion nestled among old trees. Along the outer lower corners, include subtle archival details: an open antique book, rolled manuscripts, a calligraphy brush, and a few aged newspaper sheets with completely illegible markings. Add a faint Dong Son bronze-drum sun motif near an outer corner, softly integrated into the parchment texture. Warm dawn light emerging behind distant mountains should suggest independence, resilience, dignity, and hope. Use warm ivory, antique parchment gold, muted bronze, deep forest green, and a very small accent of dark cinnabar red. Refined painterly realism with delicate traditional Vietnamese ink-painting influences, soft atmospheric depth, low contrast, tasteful and solemn, welcoming rather than theatrical. Keep the central 60 percent and upper central area mostly empty, pale, and evenly lit, with very few details: a large dark-green Vietnamese headline will be placed there by the website. Place all decorative objects along the lower edge and outer corners. The center crop must also work on a narrow mobile screen. Full-bleed landscape, 16:9, ideally 2560 × 1440 or larger. Background artwork only; do not draw the headline or any other readable text. No website interface, no logos, no watermarks, no borders, no portraits, no invented historical documents, no battle scenes, no weapons, no propaganda-poster composition, no dense collage, no saturated neon colors, no hard shadows.

## Negative prompt (nếu model hỗ trợ)

> readable text, letters, typography, headline, logo, watermark, UI, buttons, borders, portrait, face, battle, weapon, crowded collage, propaganda poster, neon, oversaturated colors, heavy shadows, high contrast, busy center, cluttered composition

## Dùng trong giao diện

- Ảnh nền dùng cho vùng nội dung bên phải sidebar; trên điện thoại vùng này chiếm toàn chiều ngang. CSS dùng `center / cover` nên các cạnh sẽ bị cắt.
- Giữ vùng giữa sáng, thoáng để tiêu đề màu xanh đậm dễ đọc. Không yêu cầu model vẽ chữ lên ảnh.
- Xuất hoặc chuyển ảnh sang WebP và thay `public/bg.webp`. `.welcome-page` trong `src/App.css` dùng URL `/bg.webp` và lớp phủ trắng 55%.
- Chỉ thay ảnh sau khi bạn chọn được kết quả sinh phù hợp. Prompt này không tự động tạo ảnh mới.
