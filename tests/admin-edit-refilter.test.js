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
}));

import { runEditProduct } from "../public/js/helpers/admin-products.js";
import { sendToBack } from "../public/js/util/api-front.js";
import { getEditProductParams } from "../public/js/util/params.js";
import { displayPopup } from "../public/js/util/popup.js";
import { confirmProductCodeUnique } from "../public/js/helpers/admin-categories.js";

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
    this.children.push(...children);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

class FakeSelect extends FakeElement {
  constructor() {
    super("select");
    this._children = [];
    this.selectedIndex = 0;
  }

  get children() {
    return this._children;
  }

  set children(children) {
    this._children = children;
  }

  get options() {
    return this._children;
  }

  set innerHTML(value) {
    if (value === "") this._children = [];
  }

  querySelector(selector) {
    if (selector !== "option[disabled]") return null;

    for (let i = 0; i < this._children.length; i++) {
      if (this._children[i].disabled) return this._children[i];
    }

    return null;
  }
}

const getOptionValues = (selectElement) => {
  const values = [];
  for (let i = 0; i < selectElement.options.length; i++) {
    values.push(selectElement.options[i].value);
  }

  return values;
};

const buildEditDom = () => {
  const placeholder = new FakeElement("option");
  placeholder.value = "";
  placeholder.disabled = true;

  const selectedProductOption = new FakeElement("option");
  selectedProductOption.value = "1";

  const productSelector = new FakeSelect();
  productSelector.append(placeholder, selectedProductOption);
  productSelector.selectedIndex = 1;
  productSelector.value = "1";

  const typeFilter = new FakeSelect();
  typeFilter.value = "paintings";

  const editNameField = new FakeElement("input");

  global.document = {
    createElement: (tagName) => new FakeElement(tagName),
    querySelector: () => null,
    getElementById: (id) => {
      if (id === "product-selector") return productSelector;
      if (id === "edit-product-filter") return typeFilter;
      if (id === "edit-name") return editNameField;
      return null;
    },
  };

  return { productSelector, typeFilter, editNameField };
};

const mockEditRoundTrip = (refreshedProducts) => {
  getEditProductParams.mockResolvedValue({ name: "Blue", price: 100 });
  confirmProductCodeUnique.mockResolvedValue(true);
  sendToBack.mockImplementation(async (params) => {
    if (params.route === "/edit-product-route") return { success: true, name: "Blue" };
    if (params.route === "/get-product-data-route") return refreshedProducts;
    return null;
  });
};

describe("runEditProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.document;
  });

  test("retargets the filter when the edited product's type moves outside it", async () => {
    const { productSelector, typeFilter, editNameField } = buildEditDom();
    mockEditRoundTrip([
      { productId: "1", productCode: "B1", name: "Blue", productType: "prints" },
      { productId: "2", productCode: "A1", name: "Amber", productType: "paintings" },
    ]);

    const data = await runEditProduct();

    expect(data).toEqual({ success: true, name: "Blue" });
    expect(typeFilter.value).toBe("prints");
    expect(getOptionValues(productSelector)).toEqual(["", "1"]);
    expect(productSelector.value).toBe("1");
    expect(editNameField.value).toBe("Blue");
    expect(displayPopup).toHaveBeenCalledWith('Product "Blue" updated successfully', "success");
  });

  test("keeps the active filter when the edited type still matches it", async () => {
    const { productSelector, typeFilter, editNameField } = buildEditDom();
    mockEditRoundTrip([
      { productId: "1", productCode: "B1", name: "Blue", productType: "paintings" },
      { productId: "2", productCode: "A1", name: "Amber", productType: "prints" },
    ]);

    const data = await runEditProduct();

    expect(data).toEqual({ success: true, name: "Blue" });
    expect(typeFilter.value).toBe("paintings");
    expect(getOptionValues(productSelector)).toEqual(["", "1"]);
    expect(productSelector.value).toBe("1");
    expect(editNameField.value).toBe("Blue");
  });
});
