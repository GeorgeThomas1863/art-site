// src/categories.js is the admin categories layer: category CRUD (with lazy default seed),
// letter lookup for a productType, and the <LETTER><NNN> next-item-id generator that scans the
// products collection.

import { describe, it, expect } from "vitest";
import {
  buildCategoryKey,
  getCategories,
  buildCategoryList,
  addCategory,
  deleteCategory,
  findCategoryLetter,
  buildNextItemId,
  findItemIdOwner,
  DEFAULT_CATEGORIES,
} from "../src/categories.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";
import { buildProductDoc } from "./helpers/mock-req.js";

const CATEGORIES = process.env.CATEGORIES_COLLECTION;
const PRODUCTS = process.env.PRODUCTS_COLLECTION;

//---------- buildCategoryKey ----------

describe("buildCategoryKey", () => {
  it("builds a camelCase key from a two-word title", () => {
    expect(buildCategoryKey("Wall Pieces")).toBe("wallPieces");
  });

  it("builds a camelCase key from a three-word title", () => {
    expect(buildCategoryKey("Mountain Treasure Baskets")).toBe("mountainTreasureBaskets");
  });

  it("strips punctuation before building the key", () => {
    expect(buildCategoryKey("Acorn Caps!")).toBe("acornCaps");
  });

  it("returns null when the title has no alphanumeric content", () => {
    expect(buildCategoryKey("!!!")).toBeNull();
  });

  it("returns null for a blank or missing title", () => {
    expect(buildCategoryKey("")).toBeNull();
    expect(buildCategoryKey(undefined)).toBeNull();
  });
});

//---------- getCategories (lazy seed) ----------

describe("getCategories", () => {
  it("lazily seeds the default categories when the collection is empty", async () => {
    const result = await getCategories();

    expect(result).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(readCollection(CATEGORIES)).toHaveLength(DEFAULT_CATEGORIES.length);

    const seededKeys = [];
    for (const category of result) seededKeys.push(category.key);

    const expectedKeys = [];
    for (const category of DEFAULT_CATEGORIES) expectedKeys.push(category.key);

    expect(seededKeys).toEqual(expectedKeys);
  });

  it("does not reseed when categories already exist", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await getCategories();
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("acorns");
  });
});

//---------- buildCategoryList ----------

describe("buildCategoryList", () => {
  it("counts products per category by productType", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G" },
    ]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productType: "acorns" }),
      buildProductDoc({ productId: "prod-2", productType: "acorns" }),
      buildProductDoc({ productId: "prod-3", productType: "geodes" }),
    ]);

    const list = await buildCategoryList();

    expect(list).toEqual([
      { key: "acorns", title: "Acorns", letter: "A", productCount: 2 },
      { key: "geodes", title: "Geodes", letter: "G", productCount: 1 },
    ]);
  });

  it("reports zero products for a category nothing uses", async () => {
    seedCollection(CATEGORIES, [{ key: "other", title: "Other", letter: "O" }]);
    const list = await buildCategoryList();
    expect(list).toEqual([{ key: "other", title: "Other", letter: "O", productCount: 0 }]);
  });
});

//---------- addCategory ----------

describe("addCategory", () => {
  it("adds a new category and returns it", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await addCategory({ title: "Geodes", letter: "g" });

    expect(result.success).toBe(true);
    expect(result.category).toMatchObject({ key: "geodes", title: "Geodes", letter: "G" });
    expect(readCollection(CATEGORIES)).toHaveLength(2);
  });

  it("rejects a missing title", async () => {
    const result = await addCategory({ letter: "A" });
    expect(result.success).toBe(false);
    expect(readCollection(CATEGORIES)).toHaveLength(0);
  });

  it("rejects a blank title", async () => {
    const result = await addCategory({ title: "   ", letter: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a title longer than 60 characters", async () => {
    const longTitle = "A".repeat(61);
    const result = await addCategory({ title: longTitle, letter: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a title that produces no usable key", async () => {
    const result = await addCategory({ title: "!!!", letter: "A" });
    expect(result.success).toBe(false);
  });

  it('rejects "all" as a reserved category name', async () => {
    const result = await addCategory({ title: "All", letter: "A" });
    expect(result).toEqual({ success: false, message: 'Category name "all" is reserved' });
  });

  it("rejects a title whose key already exists", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await addCategory({ title: "Acorns", letter: "B" });
    expect(result).toEqual({ success: false, message: "Category already exists" });
  });

  it("rejects a letter that isn't a single A-Z character", async () => {
    const result = await addCategory({ title: "Geodes", letter: "AB" });
    expect(result.success).toBe(false);

    const result2 = await addCategory({ title: "Baskets", letter: "1" });
    expect(result2.success).toBe(false);

    const result3 = await addCategory({ title: "Other Stuff", letter: "" });
    expect(result3.success).toBe(false);
  });

  it("rejects a letter already used by another category, naming its title", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await addCategory({ title: "Animals", letter: "a" });
    expect(result).toEqual({ success: false, message: "Letter A is already used by Acorns" });
  });
});

//---------- deleteCategory ----------

describe("deleteCategory", () => {
  it("deletes an existing category", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G" },
    ]);
    const result = await deleteCategory("acorns");
    expect(result.success).toBe(true);

    const remaining = readCollection(CATEGORIES);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe("geodes");
  });

  it("returns failure for an unknown key", async () => {
    const result = await deleteCategory("nope");
    expect(result.success).toBe(false);
  });

  it("does not modify products that used the deleted category", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productType: "acorns" })]);

    await deleteCategory("acorns");

    expect(readCollection(PRODUCTS)[0].productType).toBe("acorns");
  });
});

//---------- findCategoryLetter ----------

describe("findCategoryLetter", () => {
  it("returns the letter for a known productType", async () => {
    seedCollection(CATEGORIES, [{ key: "wallPieces", title: "Wall Pieces", letter: "W" }]);
    expect(await findCategoryLetter("wallPieces")).toBe("W");
  });

  it("returns null for an unknown productType", async () => {
    seedCollection(CATEGORIES, [{ key: "wallPieces", title: "Wall Pieces", letter: "W" }]);
    expect(await findCategoryLetter("nope")).toBeNull();
  });

  it("returns null for a blank productType", async () => {
    expect(await findCategoryLetter("")).toBeNull();
    expect(await findCategoryLetter(undefined)).toBeNull();
  });
});

//---------- buildNextItemId ----------

describe("buildNextItemId", () => {
  it("returns <LETTER>001 when no product uses that letter yet", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    expect(await buildNextItemId("acorns")).toBe("A001");
  });

  it("returns the next number after the highest existing one", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", itemId: "A001" }),
      buildProductDoc({ productId: "prod-2", itemId: "A007" }),
    ]);
    expect(await buildNextItemId("acorns")).toBe("A008");
  });

  it("ignores itemIds that don't match the letter pattern, wrong letters, or missing itemId", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "B" },
    ]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", itemId: "a-1" }),
      buildProductDoc({ productId: "prod-2", itemId: "B003" }),
      buildProductDoc({ productId: "prod-3", itemId: undefined }),
    ]);
    expect(await buildNextItemId("acorns")).toBe("A001");
  });

  it("matches the letter case-insensitively when scanning existing itemIds", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "a005" })]);
    expect(await buildNextItemId("acorns")).toBe("A006");
  });

  it("grows past 3 digits naturally once the max reaches 999", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "A999" })]);
    expect(await buildNextItemId("acorns")).toBe("A1000");
  });

  it("returns null for an unknown category", async () => {
    expect(await buildNextItemId("nope")).toBeNull();
  });
});

//---------- findItemIdOwner ----------

describe("findItemIdOwner", () => {
  it("finds the owning product case-insensitively and with surrounding whitespace trimmed", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "A001" })]);
    const owner = await findItemIdOwner("  a001  ");
    expect(owner.productId).toBe("prod-1");
  });

  it("excludes the product identified by excludeProductId", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "A001" })]);
    const owner = await findItemIdOwner("A001", "prod-1");
    expect(owner).toBeNull();
  });

  it("still finds a different product's matching itemId when excluding another id", async () => {
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", itemId: "A001" }),
      buildProductDoc({ productId: "prod-2", itemId: "A001" }),
    ]);
    const owner = await findItemIdOwner("A001", "prod-2");
    expect(owner.productId).toBe("prod-1");
  });

  it("returns null for a blank itemId", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "A001" })]);
    expect(await findItemIdOwner("")).toBeNull();
    expect(await findItemIdOwner("   ")).toBeNull();
  });

  it("returns null when nothing matches", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", itemId: "A001" })]);
    expect(await findItemIdOwner("Z999")).toBeNull();
  });
});
