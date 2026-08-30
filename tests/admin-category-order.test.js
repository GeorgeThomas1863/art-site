import { afterEach, describe, expect, test } from "vitest";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.id = "";
    this.name = "";
    this.textContent = "";
    this.value = "";
    this.selected = false;
    this.disabled = false;
  }

  append(...children) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  get classList() {
    return {
      contains: (className) => this.className.split(" ").includes(className),
      add: (className) => {
        if (this.className.split(" ").includes(className)) return;
        this.className = (this.className + " " + className).trim();
      },
      remove: (className) => {
        const parts = this.className.split(" ");
        const keptParts = [];
        for (const part of parts) {
          if (part && part !== className) keptParts.push(part);
        }
        this.className = keptParts.join(" ");
      },
    };
  }

  closest(selector) {
    const targetClass = selector.startsWith(".") ? selector.slice(1) : selector;
    let node = this;
    while (node) {
      if (node.classList.contains(targetClass)) return node;
      node = node.parent || null;
    }
    return null;
  }
}

const buildRowWithHandle = (key) => {
  const row = new FakeElement("div");
  row.className = "category-item";
  row.setAttribute("data-key", key);

  const handle = new FakeElement("div");
  handle.setAttribute("data-label", "category-drag-handle");
  row.append(handle);

  return { row, handle };
};

describe("buildOrderedCategoryKeys", () => {
  afterEach(() => {
    delete global.document;
  });

  test("returns keys in DOM order", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { buildOrderedCategoryKeys } = await import("../public/js/helpers/admin-categories.js");

    const row1 = new FakeElement("div");
    row1.className = "category-item";
    row1.setAttribute("data-key", "A");

    const row2 = new FakeElement("div");
    row2.className = "category-item";
    row2.setAttribute("data-key", "B");

    const row3 = new FakeElement("div");
    row3.className = "category-item";
    row3.setAttribute("data-key", "C");

    const listElement = new FakeElement("div");
    listElement.append(row1, row2, row3);

    const result = buildOrderedCategoryKeys(listElement);
    expect(result).toEqual(["A", "B", "C"]);
  });

  test("skips children lacking data-key", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { buildOrderedCategoryKeys } = await import("../public/js/helpers/admin-categories.js");

    const row1 = new FakeElement("div");
    row1.className = "category-item";
    row1.setAttribute("data-key", "A");

    const row2 = new FakeElement("div");
    row2.className = "category-item";

    const row3 = new FakeElement("div");
    row3.className = "category-item";
    row3.setAttribute("data-key", "C");

    const listElement = new FakeElement("div");
    listElement.append(row1, row2, row3);

    const result = buildOrderedCategoryKeys(listElement);
    expect(result).toEqual(["A", "C"]);
  });

  test("skips children without the category-item class", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { buildOrderedCategoryKeys } = await import("../public/js/helpers/admin-categories.js");

    const row1 = new FakeElement("div");
    row1.className = "category-item";
    row1.setAttribute("data-key", "A");

    const row2 = new FakeElement("div");
    row2.className = "other-class";
    row2.setAttribute("data-key", "B");

    const row3 = new FakeElement("div");
    row3.className = "category-item";
    row3.setAttribute("data-key", "C");

    const listElement = new FakeElement("div");
    listElement.append(row1, row2, row3);

    const result = buildOrderedCategoryKeys(listElement);
    expect(result).toEqual(["A", "C"]);
  });

  test("empty list returns empty array", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { buildOrderedCategoryKeys } = await import("../public/js/helpers/admin-categories.js");

    const listElement = new FakeElement("div");

    const result = buildOrderedCategoryKeys(listElement);
    expect(result).toEqual([]);
  });

  test("null listElement returns null", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { buildOrderedCategoryKeys } = await import("../public/js/helpers/admin-categories.js");

    const result = buildOrderedCategoryKeys(null);
    expect(result).toBeNull();
  });
});

describe("startCategoryDrag", () => {
  afterEach(() => {
    delete global.document;
  });

  test("arms the drag, marks the row, and cancel clears it", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { startCategoryDrag, cancelCategoryDrag } = await import("../public/js/helpers/admin-categories.js");
    cancelCategoryDrag(); // clear any drag state left armed by another test

    const { row, handle } = buildRowWithHandle("A");

    const result = startCategoryDrag(handle);

    expect(result).toBe(true);
    expect(row.classList.contains("dragging")).toBe(true);

    cancelCategoryDrag();
    expect(row.classList.contains("dragging")).toBe(false);
  });

  test("ignores a second drag start while one is armed", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { startCategoryDrag, cancelCategoryDrag } = await import("../public/js/helpers/admin-categories.js");
    cancelCategoryDrag();

    const first = buildRowWithHandle("A");
    const second = buildRowWithHandle("B");

    expect(startCategoryDrag(first.handle)).toBe(true);
    expect(startCategoryDrag(second.handle)).toBeNull();
    expect(second.row.classList.contains("dragging")).toBe(false);
    expect(first.row.classList.contains("dragging")).toBe(true);

    cancelCategoryDrag();
    expect(first.row.classList.contains("dragging")).toBe(false);
  });

  test("can arm a new drag after the previous one is cancelled", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: () => null,
    };

    const { startCategoryDrag, cancelCategoryDrag } = await import("../public/js/helpers/admin-categories.js");
    cancelCategoryDrag();

    const first = buildRowWithHandle("A");
    const second = buildRowWithHandle("B");

    expect(startCategoryDrag(first.handle)).toBe(true);
    cancelCategoryDrag();

    expect(startCategoryDrag(second.handle)).toBe(true);
    expect(second.row.classList.contains("dragging")).toBe(true);

    cancelCategoryDrag();
  });
});
