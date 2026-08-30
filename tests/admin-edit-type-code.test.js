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

  test("preserves a typed custom code through switches away and back without fetching", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "CUSTOM-7";

    await changeEditProductType({ value: "gems" });
    await changeEditProductType({ value: "acorns" });

    expect(codeInput.value).toBe("CUSTOM-7");
    expect(prefillNextProductCode).not.toHaveBeenCalled();
  });

  test("preserves the loaded product code when switching away without fetching", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });

    await changeEditProductType({ value: "gems" });

    expect(codeInput.value).toBe("AB001");
    expect(prefillNextProductCode).not.toHaveBeenCalled();
  });

  test("fills a suggestion when a cleared field switches to a different category", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });

    const result = await changeEditProductType({ value: "gems" });

    expect(prefillNextProductCode).toHaveBeenCalledWith("edit");
    expect(codeInput.value).toBe("GM001");
    expect(result).toBe("GM001");
  });

  test("replaces an auto-suggestion on a second category switch", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    prefillNextProductCode.mockImplementation(async () => {
      const suggestion = prefillNextProductCode.mock.calls.length === 1 ? "GM001" : "PT001";
      codeInput.value = suggestion;
      return suggestion;
    });

    await changeEditProductType({ value: "gems" });
    const result = await changeEditProductType({ value: "prints" });

    expect(prefillNextProductCode).toHaveBeenCalledTimes(2);
    expect(codeInput.value).toBe("PT001");
    expect(result).toBe("PT001");
  });

  test("restores the saved code when a blank field switches back to the saved category", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    await changeEditProductType({ value: "gems" });
    codeInput.value = "";
    const result = await changeEditProductType({ value: "acorns" });

    expect(codeInput.value).toBe("AB001");
    expect(result).toBe("AB001");
    expect(prefillNextProductCode).toHaveBeenCalledTimes(1);
  });

  test("treats whitespace-only code as blank when switching categories", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "   ";

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });

    await changeEditProductType({ value: "gems" });

    expect(prefillNextProductCode).toHaveBeenCalledWith("edit");
    expect(codeInput.value).toBe("GM001");
  });

  test("keeps an auto-restored saved code replaceable on the next switch", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "PT001";
      return "PT001";
    });

    await changeEditProductType({ value: "gems" });
    codeInput.value = "";
    await changeEditProductType({ value: "acorns" });
    await changeEditProductType({ value: "prints" });

    expect(codeInput.value).toBe("PT001");
    expect(prefillNextProductCode).toHaveBeenCalledTimes(2);
  });

  test("leaves a manual edit alone when the same category is re-selected", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });

    const selectElement = { value: "gems" };
    await changeEditProductType(selectElement);
    codeInput.value = "GM005";
    const result = await changeEditProductType(selectElement);

    expect(codeInput.value).toBe("GM005");
    expect(result).toBe(null);
    expect(prefillNextProductCode).toHaveBeenCalledTimes(1);
  });

  test("keeps the winning code auto-replaceable when a stale switch's prefill resolves last", async () => {
    const { codeInput } = await loadEditForm({ productType: "acorns", productCode: "AB001" });
    codeInput.value = "";

    let releaseFirst;
    let releaseSecond;
    prefillNextProductCode
      .mockReturnValueOnce(new Promise((resolve) => { releaseFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { releaseSecond = resolve; }));

    const firstPending = changeEditProductType({ value: "gems" }); // switch 1
    const secondPending = changeEditProductType({ value: "prints" }); // switch 2 before switch 1's prefill answers

    codeInput.value = "PT001"; // the newest prefill wins the field
    releaseSecond("PT001");
    releaseFirst(null); // the stale gems prefill was discarded, so its switch resolves null last
    const firstResult = await firstPending;
    const secondResult = await secondPending;

    expect(firstResult).toBe(null);
    expect(secondResult).toBe("PT001");

    // PT001 must still count as auto-filled, so the next switch may replace it
    prefillNextProductCode.mockImplementation(async () => {
      codeInput.value = "GM001";
      return "GM001";
    });
    const thirdResult = await changeEditProductType({ value: "gems" });

    expect(thirdResult).toBe("GM001");
    expect(codeInput.value).toBe("GM001");
  });
});
