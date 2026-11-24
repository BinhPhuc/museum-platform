# Museum platform

## Product context
- This repository was cloned from `BinhPhuc/reading-platform`. That application remains live; work only in this museum repository.
- Museum is a Vietnamese memory archive: visitors browse and view memories in video, image, and document formats.
- Serve media directly from this server. Do not add S3, compatible object storage, or external document-viewer services.
- The inherited reading catalog and EPUB viewer have been removed at the user’s request. Support video, image, DOCX, and PDF viewing. PDF support was restored at the user’s subsequent request; keep its worker on this server.

## Development
- Stack: React 19, Vite 8, JavaScript ES modules, plain CSS.
- `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:browser`.
- `src/data/memories.js` defines the memory catalog; do not restore the old reading catalog.
- Static files belong under `public/memories/`; URLs omit `public`.
- `npm run build` produces a complete `dist/`. `npm run build:app` produces `dist-app/` without media; production must serve `/memories/` separately on the same server.
- Search UI has been removed by the user. Keep sample content in tests only.
- Nginx origin configuration is in `deploy/nginx/`: HTTP port 80 behind an existing Cloudflare Tunnel, no origin TLS or HTTPS redirect. Trust the client-IP header only from the local connector.
- Run `NGINX_TEST_URL=<local test origin> npm run test:nginx` when changing Nginx behavior; setup is documented in `deploy/nginx/README.md`.
- Keep all visible UI text in Vietnamese. Include loading, failure, and unsupported-format states for new viewers.
- Detect content types through `src/lib/content.js`; unsupported formats offer a download only.
- Reset viewer state when the selected item changes and cancel asynchronous work on unmount.
- Sanitize DOCX-derived HTML before rendering. DOCX is a reading view, not a Word layout editor.
- Keep large viewers lazy-loaded and videos on `preload="metadata"` without autoplay.
- Verify relevant viewer behavior, `npm test`, `npm run lint`, and `npm run build` before delivery.

## Background
- The current image is `public/bg.webp`, used by `.welcome-page` in `src/App.css`.
- The replacement image prompt and crop guidance are in `docs/background-prompt.md`.
- Do not generate new background artwork unless requested. The existing artwork is encoded as WebP to keep the build small.
