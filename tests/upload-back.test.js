// src/upload-back.js deletes uploaded product/event/newsletter images and resizes newsletter
// images via sharp. deletePic is the security-sensitive path: a crafted filename must never
// be able to escape the target upload directory or reach a file outside it.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("sharp", () => ({ default: vi.fn() }));

import sharp from "sharp";
import { deletePic, resizeNewsletterImage, uploadDir } from "../src/upload-back.js";

describe("module import", () => {
  it("creates public/images/newsletter as a side effect of loading the module", () => {
    expect(fs.existsSync(path.join(uploadDir, "newsletter"))).toBe(true);
  });
});

describe("deletePic", () => {
  let tempFile;

  afterEach(() => {
    if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    tempFile = undefined;
  });

  it("rejects an invalid entity type", async () => {
    const result = await deletePic("photo.jpg", "not-a-real-type");
    expect(result).toEqual({ success: false, message: "Invalid entity type" });
  });

  it("rejects a missing entity type", async () => {
    const result = await deletePic("photo.jpg", undefined);
    expect(result).toEqual({ success: false, message: "Invalid entity type" });
  });

  it("rejects a filename that is empty or sanitizes down to nothing", async () => {
    for (const filename of ["", ".."]) {
      const result = await deletePic(filename, "products");
      expect(result).toEqual({ success: false, message: "Invalid filename" });
    }
  });

  it("neutralizes path traversal attempts without deleting anything", async () => {
    const unlinkSpy = vi.spyOn(fs, "unlinkSync");

    for (const payload of ["..\\..\\secret.txt", "../../secret.txt"]) {
      const result = await deletePic(payload, "products");
      expect(result.success).toBe(false);
    }

    expect(unlinkSpy).not.toHaveBeenCalled();
    unlinkSpy.mockRestore();
  });

  it("returns not-found for a file that does not exist", async () => {
    const result = await deletePic("upload-back-does-not-exist.jpg", "products");
    expect(result).toEqual({ success: false, message: "File not found" });
  });

  it("deletes an existing file and reports success", async () => {
    tempFile = path.join(uploadDir, "products", "upload-back-test-delete-me.jpg");
    fs.writeFileSync(tempFile, "fake image bytes");

    const result = await deletePic("upload-back-test-delete-me.jpg", "products");

    expect(result).toEqual({ success: true, message: "File deleted successfully" });
    expect(fs.existsSync(tempFile)).toBe(false);
  });
});

describe("resizeNewsletterImage", () => {
  let tempFile;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    tempFile = undefined;
  });

  it("returns early for a video file without calling sharp", async () => {
    await resizeNewsletterImage(path.join(uploadDir, "newsletter", "upload-back-clip.mp4"));
    expect(sharp).not.toHaveBeenCalled();
  });

  it("reads the file, resizes to 600px wide via sharp, and writes the result back", async () => {
    tempFile = path.join(uploadDir, "newsletter", "upload-back-resize-test.jpg");
    fs.writeFileSync(tempFile, "original-bytes");

    const outputBuffer = Buffer.from("resized-bytes");
    const toBuffer = vi.fn().mockResolvedValue(outputBuffer);
    const resize = vi.fn().mockReturnValue({ toBuffer });
    sharp.mockReturnValue({ resize });

    await resizeNewsletterImage(tempFile);

    expect(sharp).toHaveBeenCalledWith(Buffer.from("original-bytes"));
    expect(resize).toHaveBeenCalledWith({ width: 600 });
    expect(fs.readFileSync(tempFile)).toEqual(outputBuffer);
  });

  it("swallows a resize failure and leaves the original file intact", async () => {
    tempFile = path.join(uploadDir, "newsletter", "upload-back-resize-fail.jpg");
    fs.writeFileSync(tempFile, "original-bytes");

    const toBuffer = vi.fn().mockRejectedValue(new Error("sharp blew up"));
    const resize = vi.fn().mockReturnValue({ toBuffer });
    sharp.mockReturnValue({ resize });

    await expect(resizeNewsletterImage(tempFile)).resolves.toBeUndefined();

    expect(fs.readFileSync(tempFile, "utf8")).toBe("original-bytes");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
