import { useEffect, useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import DOMPurify from "dompurify";
import MemoryHeader from "./MemoryHeader";

export default function DocxReader({ item, onClose }) {
  const [result, setResult] = useState({ status: "loading", html: "" });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(item.file, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const converted = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            externalFileAccess: false,
          },
        );
        const html = DOMPurify.sanitize(converted.value, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ["style", "input", "form", "button"],
          FORBID_ATTR: ["style"],
          SANITIZE_NAMED_PROPS: true,
        });
        if (!cancelled) setResult({ status: "ready", html });
      } catch {
        if (!cancelled) setResult({ status: "error", html: "" });
      }
    }
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [item.file]);

  return (
    <section className="memory-viewer" aria-label={item.name}>
      <MemoryHeader item={item} onClose={onClose} />
      <div className="docx-body">
        {result.status === "loading" && (
          <p className="viewer-status" role="status">
            Đang tải tài liệu DOCX…
          </p>
        )}
        {result.status === "error" && (
          <p className="viewer-status viewer-status--error" role="alert">
            Không thể mở tài liệu DOCX. Bạn có thể tải bản gốc ở trên.
          </p>
        )}
        {result.status === "ready" && (
          <>
            {result.html ? (
              <article
                className="docx-content"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            ) : (
              <p className="viewer-status">
                Tài liệu không có nội dung để hiển thị.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
