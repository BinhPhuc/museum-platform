import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import MemoryHeader from "./MemoryHeader";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export default function PdfReader({ item, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderSet, setRenderSet] = useState(new Set());

  const bodyNodeRef = useRef(null);
  const visibleRatios = useRef({});
  const [pageHeights, setPageHeights] = useState({});
  const wrapperRefs = useRef({});

  const bodyRef = useCallback((node) => {
    bodyNodeRef.current = node;
    if (!node) return;
    setContainerWidth(node.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    const initialSet = new Set(Array.from({ length: Math.min(5, numPages) }, (_, i) => i + 1));
    setRenderSet(initialSet);
  };

  useEffect(() => {
    if (!numPages || !bodyNodeRef.current) return;

    const root = bodyNodeRef.current;
    const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);

    const pageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visibleRatios.current[Number(e.target.dataset.page)] = e.intersectionRatio;
        });
        let best = 1, bestR = -1;
        for (const [p, r] of Object.entries(visibleRatios.current)) {
          if (r > bestR) { bestR = r; best = Number(p); }
        }
        if (bestR > 0) setCurrentPage(best);
      },
      { root, threshold: thresholds },
    );

    const renderObserver = new IntersectionObserver(
      (entries) => {
        setRenderSet((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => {
            const page = Number(e.target.dataset.page);
            if (e.isIntersecting) next.add(page);
            else next.delete(page);
          });
          return next;
        });
      },
      { root, rootMargin: "150% 0px", threshold: 0 },
    );

    const wrappers = root.querySelectorAll("[data-page]");
    wrappers.forEach((el) => {
      pageObserver.observe(el);
      renderObserver.observe(el);
    });

    return () => {
      pageObserver.disconnect();
      renderObserver.disconnect();
    };
  }, [numPages]);

  const pageWidth = containerWidth
    ? Math.max(1, Math.min(containerWidth - 48, 900))
    : undefined;

  const estimatedHeight = pageWidth ? Math.round(pageWidth * 1.414) : 1100;

  return (
    <div className="pdf-reader">
      <MemoryHeader item={item} onClose={onClose} />

      <div className="pdf-body" ref={bodyRef}>
        {numPages && (
          <div className="pdf-page-badge">
            {currentPage} / {numPages}
          </div>
        )}
        <Document
          file={item.file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="viewer-status" role="status">Đang tải PDF…</div>}
          error={
            <div className="viewer-status viewer-status--error" role="alert">
              Không thể tải file PDF.
            </div>
          }
        >
          {numPages &&
            Array.from({ length: numPages }, (_, i) => {
              const pageNum = i + 1;
              const shouldRender = renderSet.has(pageNum);
              const knownHeight = pageHeights[pageNum];
              return (
                <div
                  key={pageNum}
                  data-page={pageNum}
                  className="pdf-page-wrapper"
                  ref={(el) => { wrapperRefs.current[pageNum] = el; }}
                  style={
                    !shouldRender
                      ? { minHeight: knownHeight || estimatedHeight, width: pageWidth }
                      : undefined
                  }
                >
                  {shouldRender && (
                    <Page
                      loading={<p className="viewer-status" role="status">Đang tải trang…</p>}
                      error={<p className="viewer-status viewer-status--error" role="alert">Không thể hiển thị trang PDF.</p>}
                      pageNumber={pageNum}
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onRenderSuccess={() => {
                        const el = wrapperRefs.current[pageNum];
                        if (el) {
                          const height = el.getBoundingClientRect().height;
                          setPageHeights((previous) => previous[pageNum] === height ? previous : { ...previous, [pageNum]: height });
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
        </Document>
      </div>
    </div>
  );
}
