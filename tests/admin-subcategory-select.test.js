// Admin product-form Subcategory dropdown: a saved product pointing at a deleted subcategory must
// keep that key in the edit form (so an edit-save doesn't erase it), the add form must not offer it.

import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("../public/js/util/api-front.js", () => ({ sendToBack: vi.fn() }));
vi.mock("../public/js/util/popup.js", () => ({ displayPopup: vi.fn(), displayConfirmDialog: vi.fn() }));

import { sendToBack } from "../public/js/util/api-front.js";
import { loadCategories, populateSubcategorySelect } from "../public/js/helpers/admin-categories.js";

const CATEGORIES = [
  { key: "wearableArt", title: "Wearable Art", subcategories: [{ key: "earrings", title: "Earrings" }, { key: "rings", title: "Rings" }] },
  { key: "wallPieces", title: "Wall Pieces", subcategories: [] },
];

class FakeOption {
  constructor() {
    this.value = "";
    this.textContent = "";
  }
}

// Mirrors a real <select>: assigning a value with no matching option leaves it at ""
class FakeSelect {
  constructor(value) {
    this.options = [];
    this.selectedValue = value;
    this.row = { hiddenFlag: false, classList: { toggle: (_, force) => (this.row.hiddenFlag = force) } };
  }

  set innerHTML(_) {
    this.options = [];
    this.selectedValue = "";
  }

  append(option) {
    this.options.push(option);
  }

  get value() {
    return this.selectedValue;
  }

  set value(newValue) {
    let isOption = false;
    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i].value === newValue) isOption = true;
    }
    this.selectedValue = isOption ? newValue : "";
  }

  closest() {
    return this.row;
  }
}

const mountForm = (mode, categoryKey) => {
  const typeSelect = { value: categoryKey };
  const subSelect = new FakeSelect("");
  const typeId = mode === "edit" ? "edit-product-type" : "product-type";
  const subId = mode === "edit" ? "edit-product-sub-type" : "product-sub-type";

  global.document = {
    createElement: () => new FakeOption(),
    getElementById: (id) => (id === typeId ? typeSelect : id === subId ? subSelect : null),
  };
  return { typeSelect, subSelect };
};

const optionTexts = (subSelect) => {
  const texts = [];
  for (let i = 0; i < subSelect.options.length; i++) texts.push(subSelect.options[i].textContent);
  return texts;
};

beforeAll(async () => {
  global.document = { getElementById: () => null, createElement: () => new FakeOption() };
  sendToBack.mockResolvedValue(CATEGORIES);
  await loadCategories();
  delete global.document;
});

afterEach(() => {
  delete global.document;
});

describe("populateSubcategorySelect", () => {
  test("selects a saved subcategory that still exists", () => {
    const { subSelect } = mountForm("edit", "wearableArt");

    populateSubcategorySelect("edit", "rings");

    expect(subSelect.value).toBe("rings");
    expect(optionTexts(subSelect)).toEqual(["None", "Earrings", "Rings"]);
    expect(subSelect.row.hiddenFlag).toBe(false);
  });

  test("edit form keeps a deleted subcategory key so saving does not erase it", () => {
    const { subSelect } = mountForm("edit", "wearableArt");

    populateSubcategorySelect("edit", "necklaces");

    expect(subSelect.value).toBe("necklaces");
    expect(optionTexts(subSelect)).toEqual(["None", "Earrings", "Rings", "necklaces (deleted)"]);
  });

  test("edit form shows the row for a deleted key even when the category has no subcategories left", () => {
    const { subSelect } = mountForm("edit", "wallPieces");

    populateSubcategorySelect("edit", "necklaces");

    expect(subSelect.value).toBe("necklaces");
    expect(subSelect.row.hiddenFlag).toBe(false);
  });

  test("add form never offers a deleted key", () => {
    const { subSelect } = mountForm("add", "wearableArt");

    populateSubcategorySelect("add", "necklaces");

    expect(subSelect.value).toBe("");
    expect(optionTexts(subSelect)).toEqual(["None", "Earrings", "Rings"]);
  });

  test("clearing the edit form empties and hides the subcategory dropdown", async () => {
    const { subSelect } = mountForm("edit", "wearableArt");
    populateSubcategorySelect("edit", "rings");
    subSelect.row.classList.add = (className) => (subSelect.row.hiddenFlag = className === "hidden");

    const { clearAdminEditFields } = await import("../public/js/helpers/admin-run.js");
    await clearAdminEditFields();

    expect(subSelect.options).toEqual([]);
    expect(subSelect.value).toBe("");
    expect(subSelect.row.hiddenFlag).toBe(true);
  });

  test("hides the row for a category with no subcategories and no saved key", () => {
    const { subSelect } = mountForm("edit", "wallPieces");

    populateSubcategorySelect("edit", "");

    expect(subSelect.value).toBe("");
    expect(subSelect.row.hiddenFlag).toBe(true);
  });
});
