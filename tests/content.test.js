import { test } from "node:test";
import assert from "node:assert/strict";
import { getContentType } from "../src/lib/content.js";

test("recognizes supported media with uppercase extensions, queries and fragments", () => {
  for (const [file, expected] of [
    ["/a.MP4?version=2#t=3", "video"], ["/a.webm", "video"], ["/a.ogv", "video"],
    ["/a.JPEG?cache=1", "image"], ["/a.avif", "image"], ["/a.png", "image"],
    ["/a.DOCX#section", "docx"], ["/a.pdf", "pdf"], ["/a.PDF?version=2#page=2", "pdf"], ["/a.epub", "unsupported"],
    ["/a.doc", "unsupported"], ["/a", "unsupported"], ["", "unsupported"],
  ]) assert.equal(getContentType({ file }), expected, file);
  assert.equal(getContentType(null), "unsupported");
});
