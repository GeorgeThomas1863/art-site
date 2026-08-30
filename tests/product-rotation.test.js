import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProductRotationEntries } from "../public/js/helpers/product-rotation.js";
import { getAdjacentRotationIndex, setCurrentPic, setMainRotationEntry } from "../public/js/helpers/rotate-pics.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("buildProductRotationEntries", () => {
  it("builds exactly one entry per product — the first image — preserving its urlName", () => {
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
      { src: "/images/products/single.jpg", urlName: "single-image-art" },
    ]);
  });

  it("skips a leading non-image picture and uses the first actual image instead", () => {
    const products = [
      {
        urlName: "video-first-art",
        picData: [
          { filename: "teaser.mp4", mediaType: "video" },
          { filename: "second.jpg", mediaType: "image" },
          { filename: "third.jpg", mediaType: "image" },
        ],
      },
    ];

    expect(buildProductRotationEntries(products)).toEqual([
      { src: "/images/products/second.jpg", urlName: "video-first-art" },
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

describe("setCurrentPic instant path", () => {
  it("swaps the image directly with no crossfade wait when instant is true", async () => {
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

    await setCurrentPic(element, "/images/products/new.jpg", true, true, true);

    expect(element.style.backgroundImage).toBe("url('/images/products/new.jpg')");
    expect(layer.style.opacity).toBe("0");
    expect(layer.style.backgroundImage).toBeUndefined();
  });

  it("still fades (layer opacity set to 1 first) when instant is omitted", async () => {
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

    const updatePromise = setCurrentPic(element, "/images/products/new.jpg", true, true);
    await Promise.resolve();

    expect(layer.style.opacity).toBe("1");
    expect(layer.style.backgroundImage).toBe("url('/images/products/new.jpg')");
    expect(element.style.backgroundImage).not.toBe("url('/images/products/new.jpg')");

    await vi.advanceTimersByTimeAsync(1600);
    await updatePromise;
    expect(element.style.backgroundImage).toBe("url('/images/products/new.jpg')");
    expect(layer.style.opacity).toBe("0");
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
