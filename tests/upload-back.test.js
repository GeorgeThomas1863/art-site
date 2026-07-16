import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// upload-back.js touches the real filesystem, multer, and sharp at import time —
// mock all of them so tests exercise only the module's own logic.
const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

const sharpMock = vi.hoisted(() => vi.fn());

vi.mock("fs", () => ({
  default: {
    existsSync: fsMocks.existsSync,
    mkdirSync: fsMocks.mkdirSync,
    unlinkSync: fsMocks.unlinkSync,
    promises: { readFile: fsMocks.readFile, writeFile: fsMocks.writeFile },
  },
}));

vi.mock("multer", () => {
  const multerFn = vi.fn(() => ({}));
  multerFn.diskStorage = vi.fn(() => ({}));
  return { default: multerFn };
});

vi.mock("sharp", () => ({ default: sharpMock }));

vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

import { deletePic, resizeNewsletterImage, uploadDir } from "../src/upload-back.js";

beforeEach(() => {
  fsMocks.existsSync.mockReset().mockReturnValue(true);
  fsMocks.unlinkSync.mockReset();
  fsMocks.readFile.mockReset();
  fsMocks.writeFile.mockReset();
  sharpMock.mockReset();
});

describe("deletePic", () => {
  it("rejects entity types outside the allowed list", async () => {
    expect((await deletePic("pic.jpg", "users")).message).toBe("Invalid entity type");
    expect((await deletePic("pic.jpg", "../products")).message).toBe("Invalid entity type");
    expect((await deletePic("pic.jpg", null)).message).toBe("Invalid entity type");
  });

  it("rejects filenames that sanitize to nothing", async () => {
    expect((await deletePic(42, "products")).message).toBe("Invalid filename");
    expect((await deletePic(null, "products")).message).toBe("Invalid filename");
  });

  it("neutralizes path traversal by reducing to the basename", async () => {
    const result = await deletePic("../../../.env", "products");

    // "../../../.env" sanitizes to ".env" inside the products dir — deleted there or not at all
    expect(result.success).toBe(true);
    const deletedPath = fsMocks.unlinkSync.mock.calls[0][0];
    expect(deletedPath.startsWith(path.resolve(path.join(uploadDir, "products")) + path.sep)).toBe(true);
    expect(deletedPath.endsWith(".env")).toBe(true);
  });

  it("blocks paths that resolve outside the entity directory", async () => {
    const result = await deletePic(".", "products");

    expect(result).toEqual({ success: false, message: "Invalid file path" });
    expect(fsMocks.unlinkSync).not.toHaveBeenCalled();
  });

  it("reports missing files without deleting", async () => {
    fsMocks.existsSync.mockReturnValue(false);

    const result = await deletePic("ghost.jpg", "products");

    expect(result).toEqual({ success: false, message: "File not found" });
    expect(fsMocks.unlinkSync).not.toHaveBeenCalled();
  });

  it("deletes an existing file inside the entity directory", async () => {
    const result = await deletePic("painting.jpg", "events");

    expect(result).toEqual({ success: true, message: "File deleted successfully" });
    const deletedPath = fsMocks.unlinkSync.mock.calls[0][0];
    expect(deletedPath).toContain("events");
    expect(deletedPath.endsWith("painting.jpg")).toBe(true);
  });
});

describe("resizeNewsletterImage", () => {
  it("skips video files entirely", async () => {
    await resizeNewsletterImage("/images/newsletter/clip.mp4");

    expect(fsMocks.readFile).not.toHaveBeenCalled();
    expect(sharpMock).not.toHaveBeenCalled();
  });

  it("resizes an image to 600px wide and overwrites it", async () => {
    const original = Buffer.from("original");
    const resized = Buffer.from("resized");
    fsMocks.readFile.mockResolvedValue(original);
    const toBuffer = vi.fn(async () => resized);
    const resize = vi.fn(() => ({ toBuffer }));
    sharpMock.mockReturnValue({ resize });

    await resizeNewsletterImage("/images/newsletter/pic.jpg");

    expect(resize).toHaveBeenCalledWith({ width: 600 });
    expect(fsMocks.writeFile).toHaveBeenCalledWith("/images/newsletter/pic.jpg", resized);
  });

  it("is non-fatal when the resize fails", async () => {
    fsMocks.readFile.mockResolvedValue(Buffer.from("original"));
    sharpMock.mockImplementation(() => {
      throw new Error("corrupt image");
    });

    await expect(resizeNewsletterImage("/images/newsletter/pic.jpg")).resolves.toBeUndefined();
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });
});
