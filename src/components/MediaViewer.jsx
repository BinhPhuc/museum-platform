import { useState } from "react";
import MemoryHeader from "./MemoryHeader";
import { getContentType } from "../lib/content";

export default function MediaViewer({ item, onClose }) {
  const [status, setStatus] = useState("loading");
  const type = getContentType(item);

  return (
    <section className="memory-viewer" aria-label={item.name}>
      <MemoryHeader item={item} onClose={onClose} />
      <div className="media-body">
        {status === "loading" && <p className="viewer-status" role="status">Đang tải {type === "video" ? "video" : "ảnh"}…</p>}
        {status === "error" && (
          <p className="viewer-status viewer-status--error" role="alert">
            Không thể hiển thị {type === "video" ? "video. Tệp có thể bị thiếu hoặc trình duyệt không hỗ trợ mã hóa này." : "ảnh. Tệp có thể bị thiếu hoặc bị hỏng."} Bạn có thể tải bản gốc ở trên.
          </p>
        )}
        {type === "video" ? (
          <video
            className="memory-video"
            src={item.file}
            poster={item.poster}
            aria-label={item.name}
            controls playsInline preload="metadata"
            onLoadedMetadata={() => setStatus("ready")}
            onError={() => setStatus("error")}
            hidden={status === "error"}
          >
            Trình duyệt không hỗ trợ phát video.
          </video>
        ) : (
          <img
            className="memory-image"
            src={item.file}
            alt={item.alt || item.name}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            hidden={status !== "ready"}
          />
        )}
        {item.description && <p className="memory-description">{item.description}</p>}
      </div>
    </section>
  );
}
