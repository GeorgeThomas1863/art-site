import { afterEach, describe, expect, test } from "vitest";

import { buildAdminProductSelector } from "../public/js/forms/admin-form.js";

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

const findById = (element, id) => {
  if (element.id === id) return element;

  for (let i = 0; i < element.children.length; i++) {
    const match = findById(element.children[i], id);
    if (match) return match;
  }

  return null;
};

const getOptionValues = (selectElement) => {
  const values = [];
  for (let i = 0; i < selectElement.options.length; i++) {
    values.push(selectElement.options[i].value);
  }

  return values;
};

describe("admin product type filter", () => {
  afterEach(() => {
    delete global.document;
  });

  test("renders the Type filter above the product selector with All selected", async () => {
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
    };

    const wrapper = await buildAdminProductSelector();
    const filter = findById(wrapper, "edit-product-filter");
    const selector = findById(wrapper, "product-selector");

    expect(filter).not.toBeNull();
    expect(filter.children).toHaveLength(1);
    expect(filter.children[0].value).toBe("All");
    expect(filter.children[0].selected).toBe(true);
    expect(wrapper.children.indexOf(filter)).toBeLessThan(wrapper.children.indexOf(selector));
  });

  test("filters cached products by type and resets to the placeholder", async () => {
    const productSelector = new FakeSelect();
    const placeholder = new FakeElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    productSelector.append(placeholder);
    const editNameField = new FakeElement("input");
    editNameField.value = "Blue";
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: () => null,
      getElementById: (id) => {
        if (id === "product-selector") return productSelector;
        if (id === "edit-name") return editNameField;
        return null;
      },
    };
    const { changeAdminProductFilter, populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    const products = [
      { productId: "3", productCode: "B2", name: "Blue", productType: "paintings" },
      { productId: "1", productCode: "A2", name: "Amber", productType: "prints" },
      { productId: "2", productCode: "A1", name: "Azure", productType: "paintings" },
    ];

    await populateAdminProductSelector(products);
    productSelector.value = "3";
    await changeAdminProductFilter({ value: "paintings" });

    expect(productSelector.value).toBe("");
    expect(getOptionValues(productSelector)).toEqual(["", "2", "3"]);
    expect(editNameField.value).toBe("");
    expect(editNameField.disabled).toBe(true);

    await changeAdminProductFilter({ value: "All" });
    expect(getOptionValues(productSelector)).toEqual(["", "2", "1", "3"]);
  });

  test("reapplies the selected type filter when products refresh", async () => {
    const productSelector = new FakeSelect();
    const placeholder = new FakeElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    productSelector.append(placeholder);
    const typeFilter = new FakeSelect();
    typeFilter.value = "paintings";
    global.document = {
      createElement: (tagName) => new FakeElement(tagName),
      getElementById: (id) => {
        if (id === "product-selector") return productSelector;
        if (id === "edit-product-filter") return typeFilter;
        return null;
      },
    };
    const { populateAdminProductSelector } = await import("../public/js/helpers/admin-products.js");
    const refreshedProducts = [
      { productId: "1", productCode: "A1", name: "Amber", productType: "prints" },
      { productId: "2", productCode: "B1", name: "Blue", productType: "paintings" },
    ];

    productSelector.value = "2";
    await populateAdminProductSelector(refreshedProducts);

    expect(productSelector.value).toBe("");
    expect(getOptionValues(productSelector)).toEqual(["", "2"]);
  });
});
