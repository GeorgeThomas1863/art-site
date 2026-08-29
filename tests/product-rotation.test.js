import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProductRotationEntries } from "../public/js/helpers/product-rotation.js";
import { getAdjacentRotationIndex, setMainRotationEntry } from "../public/js/helpers/rotate-pics.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("buildProductRotationEntries", () => {
  it("builds an entry for every image while preserving its product urlName", () => {
    const products = [
      {
        urlName: "multi-image-art",
        picData: [
          { filename: "front.jpg" },
          { filename: "detail.jpg", mediaType: "image" },
          { filename: "studio.mp4", mediaType: "video" },
        ],
      },
      { urlName: "single-image-art", picData: { filename: "single.jpg" } },
    ];

    expect(buildProductRotationEntries(products)).toEqual([
      { src: "/images/products/front.jpg", urlName: "multi-image-art" },
      { src: "/images/products/detail.jpg", urlName: "multi-image-art" },
      { src: "/images/products/single.jpg", urlName: "single-image-art" },
    ]);
  });

  it("skips hidden products and invalid picture entries", () => {
    const products = [
      { display: "no", urlName: "hidden", picData: { filename: "hidden.jpg" } },
      { urlName: "invalid", picData: [{ mediaType: "image" }, null] },
    ];

    expect(buildProductRotationEntries(products)).toEqual([]);
  });
});

describe("setMainRotationEntry", () => {
  it("sets the panel image and product link", async () => {
    const element = {
      dataset: {},
      href: "/products",
      querySelector: () => null,
      style: {},
    };

    await setMainRotationEntry(element, {
      src: "/images/products/front.jpg",
      urlName: "multi-image-art",
    });

    expect(element.dataset.urlName).toBe("multi-image-art");
    expect(element.href).toBe("/products/multi-image-art");
    expect(element.style.backgroundImage).toBe("url('/images/products/front.jpg')");
  });

  it("restores the generic product link for fallback images", async () => {
    const element = {
      dataset: { urlName: "old-product" },
      href: "/products/old-product",
      querySelector: () => null,
      style: {},
    };

    await setMainRotationEntry(element, { src: "/images/background/acorn1.jpg", urlName: null });

    expect(element.dataset.urlName).toBeUndefined();
    expect(element.href).toBe("/products");
  });

  it("keeps the visible product link until the crossfade completes", async () => {
    vi.useFakeTimers();
    const layer = buildCrossfadeLayer();
    const element = buildRotatingPanel(layer);
    vi.stubGlobal("requestAnimationFrame", (callback) => callback());
    vi.stubGlobal("Image", class {
      set src(value) {
        this.naturalWidth = 400;
        this.naturalHeight = 400;
        this.onload();
      }
    });

    const updatePromise = setMainRotationEntry(element, {
      src: "/images/products/new.jpg",
      urlName: "new-product",
    });
    await Promise.resolve();

    expect(element.href).toBe("/products/visible-product");
    await vi.advanceTimersByTimeAsync(1600);
    await updatePromise;
    expect(element.href).toBe("/products/new-product");
  });
});

describe("getAdjacentRotationIndex", () => {
  it("wraps forward from the final entry", () => {
    expect(getAdjacentRotationIndex(2, 3, "next")).toBe(0);
  });

  it("wraps backward from the first entry", () => {
    expect(getAdjacentRotationIndex(0, 3, "prev")).toBe(2);
  });
});

const buildCrossfadeLayer = () => ({
  classList: { toggle: vi.fn() },
  style: {},
});

const buildRotatingPanel = (layer) => ({
  classList: { toggle: vi.fn() },
  dataset: { urlName: "visible-product" },
  href: "/products/visible-product",
  offsetHeight: 200,
  offsetWidth: 200,
  querySelector: () => layer,
  style: { backgroundImage: "url('/images/products/visible.jpg')" },
});
