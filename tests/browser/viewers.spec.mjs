import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { treeData } from "../../src/data/memories.js";

const imageName = "Khung hình ký ức — ảnh mẫu";
const videoName = "Dòng thời gian — video mẫu";
const docxName = "Một trang ký ức — DOCX mẫu";

const pdfName = "Những trang ký ức — PDF mẫu";
const docxFile = "/test-assets/mot-trang-ky-uc.docx";
const videoFile = "/memories/BacHoDocBanTNDL/BacHo.mp4";
const pdfFile = "/memories/GocVanHay/GocVanHay.pdf";
const sampleDocx = await readFile(new URL("../fixtures/unsafe-link.docx", import.meta.url));

// Viewer fixtures are injected only during tests, never copied into public/dist.
test.beforeEach(async ({ page }) => {
  const testCatalog = {
    ...treeData,
    children: [{
      id: "test-samples", name: "Ký ức mẫu",
      children: [
        { id: "test-image", name: imageName, file: "/bg.webp" },
        { id: "test-video", name: videoName, file: videoFile },
        { id: "test-docx", name: docxName, file: docxFile },
        { id: "test-pdf", name: pdfName, file: pdfFile },
      ],
    }, ...treeData.children],
  };
  await page.route("**/src/data/memories.js*", (route) => route.fulfill({
    contentType: "text/javascript",
    body: `export const treeData = ${JSON.stringify(testCatalog)};`,
  }));
  await page.route("**/mot-trang-ky-uc.docx", (route) => route.fulfill({ body: sampleDocx }));
});

async function openSamples(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Ký ức mẫu" }).click();
}
const itemButton = (page, name) => page.getByRole("button").filter({ hasText: name });

test("renders local image, video, DOCX and returns home", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openSamples(page);
  await itemButton(page, imageName).click();
  await expect(page.locator(".memory-image")).toBeVisible();
  expect(await page.locator(".memory-image").evaluate((image) => image.naturalWidth)).toBe(1672);
  await expect(page.getByRole("link", { name: "Tải bản gốc" })).toHaveAttribute("href", "/bg.webp");
  await page.screenshot({ path: testInfo.outputPath("image-desktop.png") });
  await itemButton(page, videoName).click();
  const video = page.locator("video");
  await expect.poll(() => video.evaluate((element) => element.readyState)).toBeGreaterThanOrEqual(1);
  await expect(video).toHaveJSProperty("paused", true);
  expect(await video.getAttribute("preload")).toBe("metadata");
  await video.evaluate((element) => element.play());
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(0);
  await video.evaluate((element) => { element.pause(); element.currentTime = 2; });
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThanOrEqual(2);
  await itemButton(page, docxName).click();
  await expect(page.locator(".docx-content")).toContainText("Những câu chuyện bên gia đình");
  await expect(page.locator(".docx-content table")).toBeVisible();
  await expect(page.locator(".docx-content img")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("docx-desktop.png") });
  await page.getByRole("button", { name: "Quay lại", exact: true }).click();
  await expect(page.locator(".welcome-page")).toBeVisible();
  expect(errors).toEqual([]);
});

test("shows errors for missing media and invalid DOCX, and recovers on selection", async ({ page }) => {
  await page.route("**/bg.webp", (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.route("**/memories/BacHoDocBanTNDL/BacHo.mp4", (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.route("**/test-assets/mot-trang-ky-uc.docx", (route) => route.fulfill({ status: 200, body: "not a docx" }));
  await openSamples(page);
  for (const name of [imageName, videoName, docxName]) {
    await itemButton(page, name).click();
    await expect(page.getByRole("alert")).toContainText("Không thể");
    await expect(page.getByRole("link", { name: "Tải bản gốc" })).toBeVisible();
  }
  await page.unroute("**/bg.webp");
  await itemButton(page, imageName).click();
  await expect(page.locator(".memory-image")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("switching while DOCX loads and while closing keeps the new selection", async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const docx = sampleDocx;
  await page.route("**/mot-trang-ky-uc.docx", async (route) => {
    await gate;
    await route.fulfill({ body: docx });
  });
  await openSamples(page);
  await itemButton(page, docxName).click();
  await expect(page.getByRole("status")).toContainText("Đang tải");
  await itemButton(page, imageName).click();
  release();
  await expect(page.locator(".memory-image")).toBeVisible();
  await expect(page.locator(".docx-content")).toHaveCount(0);
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await expect(itemButton(page, imageName)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Quay lại", exact: true }).click();
  await expect(page.locator(".reader-panel--closing")).toBeVisible();
  await expect(page.locator(".sidebar-item-btn--active, .sidebar [aria-current]")).toHaveCount(0);
  await itemButton(page, videoName).click();
  await page.clock.runFor(300);
  await expect(page.locator("video")).toBeVisible();
  await expect(itemButton(page, videoName)).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("heading", { name: videoName })).toBeVisible();
});

test("mobile navigation displays DOCX without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở bộ sưu tập" }).click();
  await page.getByRole("button", { name: "Ký ức mẫu" }).click();
  await itemButton(page, docxName).click();
  await expect(page.getByRole("button", { name: "Mở bộ sưu tập" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".docx-content")).toContainText("Một trang ký ức");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("docx-mobile.png") });
});

test("sanitizes unsafe links from DOCX before rendering", async ({ page }) => {
  const unsafe = await readFile(new URL("../fixtures/unsafe-link.docx", import.meta.url));
  await page.route("**/mot-trang-ky-uc.docx", (route) => route.fulfill({ body: unsafe }));
  await openSamples(page);
  await itemButton(page, docxName).click();
  await expect(page.locator(".docx-content")).toContainText("Unsafe link");
  await expect(page.locator(".docx-content a").filter({ hasText: "Unsafe link" })).not.toHaveAttribute("href");
  await expect(page.locator(".docx-content [onclick], .docx-content script")).toHaveCount(0);
});

test("PDF renders local pages, tracks scrolling and fits mobile", async ({ page }, testInfo) => {
  const workerRequests = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("pdf.worker")) workerRequests.push(request.url());
  });
  await openSamples(page);
  await itemButton(page, "Những trang ký ức — PDF mẫu").click();
  const canvases = page.locator(".react-pdf__Page canvas");
  await expect(canvases).toHaveCount(2);
  await expect(canvases.first()).toBeVisible();
  await expect(page.locator(".pdf-page-badge")).toHaveText("1 / 2");
  await expect(page.getByRole("link", { name: "Tải bản gốc" })).toHaveAttribute("href", pdfFile);
  await page.locator(".pdf-body").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator(".pdf-page-badge")).toHaveText("2 / 2");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => canvases.first().evaluate((element) => element.getBoundingClientRect().width)).toBeLessThan(390);
  expect(await page.locator(".pdf-body").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("pdf-mobile.png") });
  await page.getByRole("button", { name: "Quay lại", exact: true }).click();
  await expect(page.locator(".welcome-page")).toBeVisible();
  expect(workerRequests.length).toBeGreaterThan(0);
  expect(workerRequests.every((url) => url.startsWith("http://127.0.0.1:4173/"))).toBe(true);
  expect(errors).toEqual([]);
});

test("PDF handles invalid files and recovers after changing selection", async ({ page }) => {
  await page.route("**/GocVanHay.pdf", (route) => route.fulfill({ status: 200, body: "invalid pdf" }));
  await openSamples(page);
  await itemButton(page, "Những trang ký ức — PDF mẫu").click();
  await expect(page.getByRole("alert")).toHaveText("Không thể tải file PDF.");
  await expect(page.getByRole("link", { name: "Tải bản gốc" })).toBeVisible();
  await itemButton(page, imageName).click();
  await expect(page.locator(".memory-image")).toBeVisible();
  await page.unroute("**/GocVanHay.pdf");
  await itemButton(page, "Những trang ký ức — PDF mẫu").click();
  await expect(page.locator(".react-pdf__Page canvas")).toHaveCount(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
