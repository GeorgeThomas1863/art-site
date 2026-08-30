import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../public/js/helpers/admin-run.js", () => ({
  clearAdminEditFields: vi.fn(),
  disableAdminEditFields: vi.fn(),
  enableAdminEditFields: vi.fn(),
  updateProductStats: vi.fn(),
}));
vi.mock("../public/js/util/api-front.js", () => ({ sendToBack: vi.fn() }));
vi.mock("../public/js/util/params.js", () => ({}));
vi.mock("../public/js/util/popup.js", () => ({}));
vi.mock("../public/js/helpers/admin-categories.js", () => ({ resetAutoProductCode: vi.fn() }));

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  add(name) {
    const names = this.element.className.split(" ").filter(Boolean);
    if (!names.includes(name)) names.push(name);
    this.element.className = names.join(" ");
  }

  remove(name) {
    this.element.className = this.element.className.split(" ").filter((item) => item && item !== name).join(" ");
  }

  contains(name) {
    return this.element.className.split(" ").includes(name);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.id = "";
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.productData = null;
    this.classList = new FakeClassList(this);
  }

  append(...children) {
    this.children.push(...children);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  set innerHTML(value) {
    if (value === "") this.children = [];
  }

  get options() {
    return this.children;
  }

  querySelector(selector) {
    if (selector === "option[disabled]") return this.children[0] || null;
    return null;
  }

  focus() {
    this.focused = true;
  }
}

const findById = (element, id) => {
  if (element.id === id) return element;
  for (let i = 0; i < element.children.length; i++) {
    const found = findById(element.children[i], id);
    if (found) return found;
  }
  return null;
};

const buildPickerDom = async () => {
  global.document = { createElement: (tagName) => new FakeElement(tagName) };
  const { buildAdminProductSelector } = await import("../public/js/forms/admin-form.js");
  const root = await buildAdminProductSelector();
  global.document.getElementById = (id) => findById(root, id);
  global.document.querySelector = () => null;
  return root;
};

const getProductIds = (list) => {
  const productIds = [];
  for (let i = 0; i < list.children.length; i++) {
    productIds.push(list.children[i].getAttribute("data-product-id"));
  }
  return productIds;
};

describe("admin picture product selector", () => {
  afterEach(() => {
    delete global.document;
  });

  test("builds labeled name and picture controls in one row", async () => {
    const root = await buildPickerDom();
    const row = findById(root, "product-selector-row");

    expect(row).not.toBeNull();
    expect(row.children[0].children[0].textContent).toBe("Select by Name / ID");
    expect(row.children[1].children[0].textContent).toBe("Select by Pic");
    expect(findById(root, "product-pic-selector-trigger").getAttribute("aria-expanded")).toBe("false");
    expect(findById(root, "product-pic-selector-list").getAttribute("role")).toBe("listbox");
  });

  test("renders filtered products in native sort order with usable pictures", async () => {
    const root = await buildPickerDom();
    const { populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    const filter = findById(root, "edit-product-filter");
    filter.value = "paintings";

    await populateAdminProductSelector([
      { productId: "3", productCode: "B2", name: "No Picture", productType: "paintings" },
      { productId: "1", productCode: "A2", name: "Video First", productType: "paintings", picData: [
        { filename: "clip.mp4", mediaType: "video" }, { filename: "portrait.jpg", mediaType: "image" },
      ] },
      { productId: "2", productCode: "A1", name: "Legacy", productType: "paintings", picData: { filename: "legacy.png" } },
      { productId: "4", productCode: "A0", name: "Print", productType: "prints", picData: { filename: "print.png" } },
    ]);

    const list = findById(root, "product-pic-selector-list");
    expect(getProductIds(list)).toEqual(["2", "1", "3"]);
    expect(list.children[0].children[0].src).toBe("/images/thumbnails/legacy.png");
    expect(list.children[1].children[0].src).toBe("/images/thumbnails/portrait.jpg");
    expect(list.children[2].children[0].classList.contains("product-pic-placeholder")).toBe(true);

    list.children[0].children[0].onerror();
    expect(list.children[0].children[0].src).toBe("/images/products/legacy.png");
  });

  test("falls back to the placeholder for legacy video entries missing mediaType", async () => {
    const root = await buildPickerDom();
    const { populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    const filter = findById(root, "edit-product-filter");
    filter.value = "paintings";

    await populateAdminProductSelector([
      { productId: "5", productCode: "A5", name: "Legacy Video", productType: "paintings", picData: { filename: "clip.MP4" } },
      { productId: "6", productCode: "A6", name: "Cased Video", productType: "paintings", picData: [
        { filename: "movie.mov", mediaType: "Video" }, { filename: "still.jpg", mediaType: "image" },
      ] },
    ]);

    const list = findById(root, "product-pic-selector-list");
    expect(list.children[0].children[0].classList.contains("product-pic-placeholder")).toBe(true);
    expect(list.children[1].children[0].src).toBe("/images/thumbnails/still.jpg");
  });

  test("routes picture choices through the native selector and syncs the trigger", async () => {
    const root = await buildPickerDom();
    const { populateAdminProductSelector, selectAdminProductByPic } = await import("../public/js/helpers/admin-products.js");
    await populateAdminProductSelector([
      { productId: "9", productCode: "A9", name: "Chosen", productType: "paintings", picData: { filename: "chosen.jpg" } },
    ]);
    const nativeSelector = findById(root, "product-selector");

    await selectAdminProductByPic("9");

    expect(nativeSelector.value).toBe("9");
    expect(findById(root, "product-pic-selector-trigger-name").textContent).toBe("Chosen");
    expect(findById(root, "product-pic-selector-trigger-image").src).toBe("/images/thumbnails/chosen.jpg");
  });

  test("syncs picture selection when the native selector changes", async () => {
    const root = await buildPickerDom();
    const { changeAdminProductSelector, populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    await populateAdminProductSelector([
      { productId: "7", productCode: "A7", name: "Native Choice", productType: "paintings", picData: { filename: "native.jpg" } },
    ]);
    const nativeSelector = findById(root, "product-selector");
    nativeSelector.value = "7";
    nativeSelector.selectedIndex = 1;

    await changeAdminProductSelector(nativeSelector);

    expect(findById(root, "product-pic-selector-trigger-name").textContent).toBe("Native Choice");
    expect(findById(root, "product-pic-selector-list").children[0].getAttribute("aria-selected")).toBe("true");
  });

  test("rerenders both selectors when the product type filter changes", async () => {
    const root = await buildPickerDom();
    const { changeAdminProductFilter, populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    await populateAdminProductSelector([
      { productId: "1", productCode: "A1", name: "Painting", productType: "paintings" },
      { productId: "2", productCode: "B1", name: "Print", productType: "prints" },
    ]);

    await changeAdminProductFilter({ value: "prints" });

    const nativeSelector = findById(root, "product-selector");
    const pictureList = findById(root, "product-pic-selector-list");
    expect(nativeSelector.options).toHaveLength(2);
    expect(nativeSelector.options[1].value).toBe("2");
    expect(getProductIds(pictureList)).toEqual(["2"]);
  });

  test("opens, moves focus, and closes for keyboard delegation", async () => {
    const root = await buildPickerDom();
    const {
      closeAdminPicSelector,
      moveAdminPicSelectorFocus,
      populateAdminProductSelector,
      toggleAdminPicSelector,
    } = await import("../public/js/helpers/admin-products.js");
    await populateAdminProductSelector([
      { productId: "1", productCode: "A1", name: "First", productType: "paintings" },
      { productId: "2", productCode: "A2", name: "Second", productType: "paintings" },
    ]);
    const list = findById(root, "product-pic-selector-list");
    const trigger = findById(root, "product-pic-selector-trigger");

    toggleAdminPicSelector();
    expect(list.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(list.children[0].focused).toBe(true);

    moveAdminPicSelectorFocus(list.children[0], 1);
    expect(list.children[1].focused).toBe(true);

    closeAdminPicSelector();
    expect(list.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
