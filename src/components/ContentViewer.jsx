import { lazy, Suspense } from "react";
import { getContentType } from "../lib/content";
import MemoryHeader from "./MemoryHeader";

const PdfReader = lazy(() => import("./PdfReader"));
const DocxReader = lazy(() => import("./DocxReader"));
const MediaViewer = lazy(() => import("./MediaViewer"));

export default function ContentViewer({ item, onClose }) {
  const type = getContentType(item);
  let content;
  if (type === "pdf") content = <PdfReader item={item} onClose={onClose} />;
  else if (type === "docx") content = <DocxReader item={item} onClose={onClose} />;
  else if (type === "video" || type === "image") content = <MediaViewer item={item} onClose={onClose} />;
  else content = (
    <section className="memory-viewer">
      <MemoryHeader item={item} onClose={onClose} />
      <p className="viewer-status" role="alert">Định dạng này chưa được hỗ trợ. Bạn có thể tải bản gốc ở trên.</p>
    </section>
  );
  return <Suspense fallback={<p className="viewer-status" role="status">Đang tải nội dung…</p>}>{content}</Suspense>;
}
