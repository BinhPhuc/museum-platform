const EXTENSION_TYPES = {
  pdf: "pdf", docx: "docx",
  mp4: "video", webm: "video", ogv: "video",
  jpg: "image", jpeg: "image", png: "image", gif: "image",
  webp: "image", avif: "image", bmp: "image",
};

export function getContentType(item) {
  const pathname = (item?.file || "").split(/[?#]/, 1)[0];
  const extension = pathname.split(".").pop().toLowerCase();
  return EXTENSION_TYPES[extension] || "unsupported";
}

export const CONTENT_LABELS = {
  pdf: "PDF", docx: "DOCX",
  video: "Video", image: "Ảnh", unsupported: "Tệp",
};
