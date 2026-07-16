import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getUniqueItem: vi.fn(),
  storeAny: vi.fn(),
  updateObjItem: vi.fn(),
  deleteItem: vi.fn(),
  getAll: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    getUniqueItem() {
      return dbMocks.getUniqueItem(this.dataObject);
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
    updateObjItem() {
      return dbMocks.updateObjItem(this.dataObject);
    }
    deleteItem() {
      return dbMocks.deleteItem(this.dataObject);
    }
    getAll() {
      return dbMocks.getAll(this.dataObject);
    }
  },
}));

import { storeProduct, updateProduct, deleteProduct, hideOrderedProducts, getProductData } from "../src/products.js";

process.env.PRODUCTS_COLLECTION = "products-test";

const insertedId = { toString: () => "pid1" };

beforeEach(() => {
  dbMocks.getUniqueItem.mockReset();
  dbMocks.storeAny.mockReset();
  dbMocks.updateObjItem.mockReset();
  dbMocks.deleteItem.mockReset();
  dbMocks.getAll.mockReset();
});

describe("storeProduct", () => {
  it("stores the product, assigns productId, and generates a URL slug from the name", async () => {
    dbMocks.storeAny.mockResolvedValue({ insertedId });
    dbMocks.getUniqueItem.mockResolvedValue(null); // slug is unique
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeProduct({ route: "/admin/add-product", name: "Blue Painting!", price: 100 });

    expect(result.success).toBe(true);
    expect(result.productId).toBe("pid1");
    expect(result.urlName).toBe("blue-painting");
    expect(result.route).toBeUndefined();
  });

  it("appends a numeric suffix when the slug is already taken", async () => {
    dbMocks.storeAny.mockResolvedValue({ insertedId });
    dbMocks.getUniqueItem.mockResolvedValueOnce({ urlName: "blue-painting" }).mockResolvedValueOnce(null);
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeProduct({ name: "Blue Painting", price: 100 });

    expect(result.urlName).toBe("blue-painting-2");
  });

  it("falls back to product-<id> when the name produces an empty slug", async () => {
    dbMocks.storeAny.mockResolvedValue({ insertedId });
    dbMocks.getUniqueItem.mockResolvedValue(null);
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeProduct({ name: "!!!", price: 100 });

    expect(result.urlName).toBe("product-pid1");
  });

  it("fails when the initial store fails", async () => {
    dbMocks.storeAny.mockResolvedValue(null);

    const result = await storeProduct({ name: "Blue Painting", price: 100 });

    expect(result).toEqual({ success: false, message: "Failed to store product" });
    expect(dbMocks.updateObjItem).not.toHaveBeenCalled();
  });
});

describe("updateProduct", () => {
  it("fails when the product does not exist", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);

    const result = await updateProduct({ productId: "ghost", name: "New Name" });

    expect(result).toEqual({ success: false, message: "Product not found" });
  });

  it("updates the product when the slug belongs to the same product", async () => {
    dbMocks.getUniqueItem
      .mockResolvedValueOnce({ productId: "p1", urlName: "blue-painting" }) // existence check
      .mockResolvedValueOnce({ productId: "p1", urlName: "blue-painting" }); // slug conflict check
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await updateProduct({ productId: "p1", name: "Blue Painting", urlName: "blue-painting" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Product updated successfully");
  });

  it("rejects a slug owned by a different product", async () => {
    dbMocks.getUniqueItem
      .mockResolvedValueOnce({ productId: "p1", urlName: "blue-painting" })
      .mockResolvedValueOnce({ productId: "other-product", urlName: "taken-slug" });

    const result = await updateProduct({ productId: "p1", urlName: "taken-slug" });

    expect(result).toEqual({ success: false, message: "URL slug already taken. Please choose a different one." });
    expect(dbMocks.updateObjItem).not.toHaveBeenCalled();
  });

  it("rejects an empty slug", async () => {
    dbMocks.getUniqueItem.mockResolvedValueOnce({ productId: "p1", urlName: "blue-painting" });

    const result = await updateProduct({ productId: "p1", urlName: "" });

    expect(result).toEqual({ success: false, message: "URL Slug cannot be empty." });
  });

  it("generates a slug for legacy products that never had one", async () => {
    dbMocks.getUniqueItem
      .mockResolvedValueOnce({ productId: "p1", name: "Old Art" }) // legacy product, no urlName
      .mockResolvedValueOnce(null); // generated slug is unique
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await updateProduct({ productId: "p1", price: 50 });

    expect(result.success).toBe(true);
    expect(result.urlName).toBe("old-art");
    const updateCall = dbMocks.updateObjItem.mock.calls[0][0];
    expect(updateCall.updateObj.urlName).toBe("old-art");
  });
});

describe("deleteProduct", () => {
  it("fails when the product does not exist", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);

    const result = await deleteProduct("ghost");

    expect(result).toEqual({ success: false, message: "Product not found" });
    expect(dbMocks.deleteItem).not.toHaveBeenCalled();
  });

  it("deletes an existing product", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ productId: "p1" });
    dbMocks.deleteItem.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteProduct("p1");

    expect(result.success).toBe(true);
    expect(result.productId).toBe("p1");
    expect(dbMocks.deleteItem.mock.calls[0][0]).toMatchObject({ keyToLookup: "productId", itemValue: "p1" });
  });
});

describe("hideOrderedProducts", () => {
  it("marks each existing ordered product as sold", async () => {
    dbMocks.getUniqueItem.mockResolvedValueOnce({ productId: "p1" }).mockResolvedValueOnce(null);
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    await hideOrderedProducts([{ productId: "p1" }, { productId: "missing" }]);

    expect(dbMocks.updateObjItem).toHaveBeenCalledTimes(1);
    const updateCall = dbMocks.updateObjItem.mock.calls[0][0];
    expect(updateCall.itemValue).toBe("p1");
    expect(updateCall.updateObj).toEqual({ sold: "yes" });
  });

  it("does nothing for an empty or missing cart", async () => {
    await hideOrderedProducts([]);
    await hideOrderedProducts(null);
    expect(dbMocks.getUniqueItem).not.toHaveBeenCalled();
  });
});

describe("getProductData", () => {
  it("returns all products", async () => {
    const products = [{ productId: "p1" }, { productId: "p2" }];
    dbMocks.getAll.mockResolvedValue(products);
    expect(await getProductData()).toBe(products);
  });
});
