// src/products.js is the admin CRUD layer for products: create (with slug generation +
// uniqueness), edit (incl. legacy slug backfill and slug-conflict checks), delete, and the
// storefront's "hide sold items" helper. There is no single-item getter (get-by-id/slug) and
// no getMaxId-derived productId/productCode in this file — see report concerns.

import { describe, it, expect } from "vitest";
import { storeProduct, updateProduct, deleteProduct, hideOrderedProducts, getProductData } from "../src/products.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";
import { buildProductDoc, buildCartItem } from "./helpers/mock-req.js";

const PRODUCTS = process.env.PRODUCTS_COLLECTION;
const CATEGORIES = process.env.CATEGORIES_COLLECTION;

//---------- read ----------

describe("getProductData", () => {
  it("returns every product in the collection", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" }), buildProductDoc({ productId: "prod-2" })]);
    const data = await getProductData();
    expect(data).toHaveLength(2);
    expect(data.map((doc) => doc.productId)).toEqual(["prod-1", "prod-2"]);
  });

  it("returns an empty array when there are no products", async () => {
    expect(await getProductData()).toEqual([]);
  });
});

//---------- create ----------

describe("storeProduct", () => {
  it("stores a new product and returns success with a generated productId and slug", async () => {
    const result = await storeProduct({ name: "Acorn Necklace", price: 25 });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Product added successfully");
    expect(result.productId).toMatch(/^fake-id-/);
    expect(result.urlName).toBe("acorn-necklace");
  });

  it("persists the product with productId and urlName written onto the stored doc", async () => {
    await storeProduct({ name: "Acorn Necklace", price: 25 });
    const stored = readCollection(PRODUCTS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ name: "Acorn Necklace", price: 25, urlName: "acorn-necklace" });
    expect(stored[0].productId).toBe(stored[0]._id);
  });

  it("strips the route field before storing", async () => {
    await storeProduct({ route: "/admin/products/add", name: "Acorn Necklace" });
    expect(readCollection(PRODUCTS)[0]).not.toHaveProperty("route");
  });

  it("lowercases the name and strips special characters to build the slug", async () => {
    const result = await storeProduct({ name: "  Rose & Thorn -- Necklace!!  " });
    expect(result.urlName).toBe("rose-thorn-necklace");
  });

  it("falls back to product-<id> when the name produces an empty slug", async () => {
    const result = await storeProduct({ name: "!!!" });
    expect(result.urlName).toBe(`product-${result.productId}`);
  });

  it("appends a numeric suffix when the generated slug is already taken", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", urlName: "acorn-necklace" })]);
    const result = await storeProduct({ name: "Acorn Necklace" });
    expect(result.urlName).toBe("acorn-necklace-2");
  });

  it("keeps incrementing the suffix past multiple existing conflicts", async () => {
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", urlName: "acorn-necklace" }),
      buildProductDoc({ productId: "prod-2", urlName: "acorn-necklace-2" }),
    ]);
    const result = await storeProduct({ name: "Acorn Necklace" });
    expect(result.urlName).toBe("acorn-necklace-3");
  });

  it("auto-assigns the next productCode when productCode is blank", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await storeProduct({ name: "Acorn Necklace", productType: "acorns" });
    expect(result.productCode).toBe("A001");
  });

  it("auto-assigns the next productCode with multi-letter prefix when productCode is blank", async () => {
    seedCollection(CATEGORIES, [{ key: "special", title: "Special Items", letter: "AB" }]);
    const result = await storeProduct({ name: "Special Item", productType: "special" });
    expect(result.productCode).toBe("AB001");
  });

  it("continues the sequence when auto-assigning against existing productCodes", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A004" })]);
    const result = await storeProduct({ name: "Acorn Necklace", productType: "acorns" });
    expect(result.productCode).toBe("A005");
  });

  it("continues the sequence with multi-letter prefix when auto-assigning against existing productCodes", async () => {
    seedCollection(CATEGORIES, [{ key: "special", title: "Special Items", letter: "AB" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "AB004" })]);
    const result = await storeProduct({ name: "Special Item", productType: "special" });
    expect(result.productCode).toBe("AB005");
  });

  it("leaves productCode blank when the productType's category is unknown", async () => {
    const result = await storeProduct({ name: "Mystery Item", productType: "nope" });
    expect(result.productCode).toBe("");
  });

  it("uppercases and trims a supplied productCode instead of generating one", async () => {
    const result = await storeProduct({ name: "Acorn Necklace", productCode: "  a1  " });
    expect(result.productCode).toBe("A1");
  });

  it("uppercases and trims a multi-letter supplied productCode instead of generating one", async () => {
    const result = await storeProduct({ name: "Special Item", productCode: "  abc001  " });
    expect(result.productCode).toBe("ABC001");
  });
});

//---------- edit ----------

describe("updateProduct", () => {
  it("returns 'Product not found' for an unknown productId", async () => {
    const result = await updateProduct({ productId: "nope", name: "New Name" });
    expect(result).toEqual({ success: false, message: "Product not found" });
  });

  it("updates an existing product and returns success", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", name: "Acorn Necklace", urlName: "acorn-necklace" })]);
    const result = await updateProduct({ productId: "prod-1", name: "New Name" });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Product updated successfully");
    expect(readCollection(PRODUCTS)[0].name).toBe("New Name");
  });

  it("backfills a slug for a legacy product that has none, when the caller doesn't supply one", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", name: "Acorn Necklace" })]); // no urlName
    const result = await updateProduct({ productId: "prod-1", price: 30 });
    expect(result.urlName).toBe("acorn-necklace");
    expect(readCollection(PRODUCTS)[0].urlName).toBe("acorn-necklace");
  });

  it("does not touch an existing urlName when the caller omits urlName entirely", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", name: "Acorn Necklace", urlName: "custom-slug" })]);
    const result = await updateProduct({ productId: "prod-1", price: 30 });
    expect(result.urlName).toBeUndefined();
    expect(readCollection(PRODUCTS)[0].urlName).toBe("custom-slug");
  });

  it("rejects an empty urlName", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" })]);
    const result = await updateProduct({ productId: "prod-1", urlName: "" });
    expect(result).toEqual({ success: false, message: "URL Slug cannot be empty." });
  });

  it("rejects a urlName already taken by a different product", async () => {
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", urlName: "acorn-necklace" }),
      buildProductDoc({ productId: "prod-2", urlName: "geode" }),
    ]);
    const result = await updateProduct({ productId: "prod-2", urlName: "acorn-necklace" });
    expect(result).toEqual({ success: false, message: "URL slug already taken. Please choose a different one." });
  });

  it("allows a product to keep its own current urlName", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", urlName: "acorn-necklace" })]);
    const result = await updateProduct({ productId: "prod-1", urlName: "acorn-necklace" });
    expect(result.success).toBe(true);
  });

  it("uppercases and trims a supplied productCode on update", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" })]);
    const result = await updateProduct({ productId: "prod-1", productCode: "  b2  " });
    expect(result.productCode).toBe("B2");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("B2");
  });

  it("uppercases and trims a multi-letter supplied productCode on update", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" })]);
    const result = await updateProduct({ productId: "prod-1", productCode: "ab12" });
    expect(result.productCode).toBe("AB12");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("AB12");
  });

  it("never auto-generates an productCode on update, even when it normalizes to blank", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    const result = await updateProduct({ productId: "prod-1", productCode: "   " });
    expect(result.productCode).toBe("");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("");
  });

  it("leaves productCode untouched when the caller omits it entirely", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    await updateProduct({ productId: "prod-1", price: 30 });
    expect(readCollection(PRODUCTS)[0].productCode).toBe("A001");
  });
});

//---------- delete ----------

describe("deleteProduct", () => {
  it("returns 'Product not found' for an unknown productId", async () => {
    const result = await deleteProduct("nope");
    expect(result).toEqual({ success: false, message: "Product not found" });
  });

  it("deletes an existing product and returns success with the productId for tracking", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" }), buildProductDoc({ productId: "prod-2" })]);
    const result = await deleteProduct("prod-1");
    expect(result).toEqual({
      success: true,
      message: "Product deleted successfully",
      keyToLookup: "productId",
      itemValue: "prod-1",
      productId: "prod-1",
    });
    expect(readCollection(PRODUCTS).map((doc) => doc.productId)).toEqual(["prod-2"]);
  });
});

//---------- hide ordered products ----------

describe("hideOrderedProducts", () => {
  it("resolves without doing anything for an empty or missing cart", async () => {
    await expect(hideOrderedProducts([])).resolves.toBeUndefined();
    await expect(hideOrderedProducts(undefined)).resolves.toBeUndefined();
  });

  it("marks every cart product as sold", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" }), buildProductDoc({ productId: "prod-2" })]);
    await hideOrderedProducts([buildCartItem({ productId: "prod-1" }), buildCartItem({ productId: "prod-2" })]);

    const stored = readCollection(PRODUCTS);
    expect(stored.find((doc) => doc.productId === "prod-1").sold).toBe("yes");
    expect(stored.find((doc) => doc.productId === "prod-2").sold).toBe("yes");
  });

  it("skips cart items whose product no longer exists, without throwing", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1" })]);
    await expect(hideOrderedProducts([buildCartItem({ productId: "gone" })])).resolves.toBeUndefined();
    expect(readCollection(PRODUCTS)[0].sold).toBeUndefined();
  });
});
