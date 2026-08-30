import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../public/js/helpers/admin-run.js", () => ({
  clearAdminEditFields: vi.fn(),
  disableAdminEditFields: vi.fn(),
  enableAdminEditFields: vi.fn(),
  updateProductStats: vi.fn(),
}));
vi.mock("../public/js/util/api-front.js", () => ({ sendToBack: vi.fn() }));
vi.mock("../public/js/util/params.js", () => ({
  buildNewProductParams: vi.fn(),
  getEditProductParams: vi.fn(),
}));
vi.mock("../public/js/util/popup.js", () => ({
  displayPopup: vi.fn(),
  displayConfirmDialog: vi.fn(),
}));
vi.mock("../public/js/forms/admin-form.js", () => ({ buildPicSlot: vi.fn() }));
vi.mock("../public/js/helpers/admin-categories.js", () => ({
  confirmProductCodeUnique: vi.fn(),
  resetAutoProductCode: vi.fn(),
  prefillNextProductCode: vi.fn(),
}));

import { changeEditProductType, populateEditFormProducts } from "../public/js/helpers/admin-products.js";
import { prefillNextProductCode } from "../public/js/helpers/admin-categories.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.id = "";
    this.value = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

// Sets up the edit form's DOM and loads a saved product into it, exactly like
// populateEditFormProducts is invoked from changeAdminProductSelector in the real app.
// querySelector returns null so the function short-circuits before the image-slot
// machinery, mirroring the setup in admin-edit-refilter.test.js.
const loadEditForm = async (savedProduct) => {
  const codeInput = new FakeElement("input");

  global.document = {
    createElement: (tagName) => new FakeElement(tagName),
    querySelector: () => null,
    getElementById: (id) => (id === "edit-product-code" ? codeInput : null),
  };

  await populateEditFormProducts(savedProduct);
  return { codeInput };
};

describe("changeEditProductType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.document;
  });

  test("suggests a new code when the category changes away from the product's saved type", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });

    let codeInputValueAtCallTime;
    prefillNextProductCode.mockImplementation(async () => {
      codeInputValueAtCallTime = codeInput.value; // captures whether the saved code was cleared first
      codeInput.value = "GM001";
      return "GM001";
    });

    const result = await changeEditProductType({ value: "gems" });

    expect(codeInputValueAtCallTime).toBe(""); // saved code AB001 must be cleared before the fetch, or prefillNextProductCode's own guard blocks the overwrite
    expect(prefillNextProductCode).toHaveBeenCalledWith("edit");
    expect(codeInput.value).toBe("GM001");
    expect(result).toBe("GM001");
  });

  test("restores the product's saved code when the saved category is picked again", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });

    await changeEditProductType({ value: "gems" }); // moves away from the saved type first
    const result = await changeEditProductType({ value: "acorns" }); // back to the saved type

    expect(codeInput.value).toBe("AB001");
    expect(result).toBe("AB001");
    expect(prefillNextProductCode).toHaveBeenCalledTimes(1); // restoring must not hit the fetch path
  });

  test("leaves a manual edit alone when the same category is re-selected without an intervening change", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });

    const selectElement = { value: "gems" };
    await changeEditProductType(selectElement); // suggestion path
    codeInput.value = "GM005"; // admin manually edits the suggestion

    const result = await changeEditProductType(selectElement); // same value as last time -> no-op

    expect(codeInput.value).toBe("GM005");
    expect(result).toBe(null);
    expect(prefillNextProductCode).toHaveBeenCalledTimes(1); // not called again
  });
});
