// src/categories.js is the admin categories layer: category CRUD (with lazy default seed),
// an admin-chosen single-letter prefix per category (NOT unique — two categories may share a
// letter and therefore a running sequence), letter changes with optional product-code renaming,
// and the <LETTER><NNN> next-product-code generator that scans the products collection.

import { describe, it, expect, vi } from "vitest";
import {
  buildCategoryKey,
  normalizeLetter,
  getCategories,
  buildCategoryList,
  addCategory,
  updateCategoryTitle,
  updateCategoryLetter,
  deleteCategory,
  findCategory,
  buildNextProductCode,
  findProductCodeOwner,
  DEFAULT_CATEGORIES,
} from "../src/categories.js";
import { seedCollection, readCollection, FakeDbModel } from "./helpers/fake-db.js";
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

  it("keeps digits and lowercases a single-word title", () => {
    expect(buildCategoryKey("BALLFUCKER1535")).toBe("ballfucker1535");
    expect(buildCategoryKey("SamAltman")).toBe("samaltman");
  });

  it("returns null when the title has no alphanumeric content", () => {
    expect(buildCategoryKey("!!!")).toBeNull();
  });

  it("returns null for a blank or missing title", () => {
    expect(buildCategoryKey("")).toBeNull();
    expect(buildCategoryKey(undefined)).toBeNull();
  });
});

//---------- normalizeLetter ----------

describe("normalizeLetter", () => {
  it("uppercases and trims a single letter", () => {
    expect(normalizeLetter(" g ")).toBe("G");
    expect(normalizeLetter("Z")).toBe("Z");
  });

  it("returns null for anything that is not exactly one A-Z letter", () => {
    expect(normalizeLetter("AB")).toBeNull();
    expect(normalizeLetter("1")).toBeNull();
    expect(normalizeLetter("")).toBeNull();
    expect(normalizeLetter(undefined)).toBeNull();
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

  it("seeds every default with a single-letter prefix", async () => {
    const result = await getCategories();
    for (const category of result) expect(category.letter).toMatch(/^[A-Z]$/);
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
  it("counts products per category by productType and includes the letter", async () => {
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
  it("adds a new category with an uppercased letter and returns it", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await addCategory({ title: "Geodes", letter: "g" });

    expect(result.success).toBe(true);
    expect(result.category).toMatchObject({ key: "geodes", title: "Geodes", letter: "G" });
    expect(readCollection(CATEGORIES)).toHaveLength(2);
  });

  it("accepts arbitrary alphanumeric titles", async () => {
    const titles = ["BALLFUCKER1535", "SamAltman", "The Golden Gate Bridge"];
    for (const title of titles) {
      const result = await addCategory({ title, letter: "X" });
      expect(result.success).toBe(true);
      expect(result.category.title).toBe(title);
    }
    expect(readCollection(CATEGORIES)).toHaveLength(DEFAULT_CATEGORIES.length + titles.length);
  });

  it("allows a letter that another category already uses", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await addCategory({ title: "Animals", letter: "A" });
    expect(result.success).toBe(true);
    expect(result.category.letter).toBe("A");
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
    expect((await addCategory({ title: "Geodes", letter: "AB" })).success).toBe(false);
    expect((await addCategory({ title: "Baskets", letter: "1" })).success).toBe(false);
    expect((await addCategory({ title: "Other Stuff", letter: "" })).success).toBe(false);
    expect((await addCategory({ title: "No Letter" })).success).toBe(false);
    expect(readCollection(CATEGORIES)).toHaveLength(0);
  });
});

//---------- updateCategoryLetter ----------

describe("updateCategoryLetter", () => {
  it("changes the letter without touching products when renumber is false", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" })]);

    const result = await updateCategoryLetter({ key: "acorns", letter: "z", renumber: false });

    expect(result).toEqual({ success: true, message: "Letter changed to Z", letter: "Z", renamedCount: 0 });
    expect(readCollection(CATEGORIES)[0].letter).toBe("Z");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("A001");
  });

  it("renames <OLD><digits> product codes of that category only, keeping the number", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "animals", title: "Animals", letter: "A" },
    ]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" }),
      buildProductDoc({ productId: "prod-2", productType: "acorns", productCode: "a012" }),
      buildProductDoc({ productId: "prod-3", productType: "acorns", productCode: "CUSTOM-7" }),
      buildProductDoc({ productId: "prod-4", productType: "animals", productCode: "A002" }),
      buildProductDoc({ productId: "prod-5", productType: "acorns", productCode: undefined }),
    ]);

    const result = await updateCategoryLetter({ key: "acorns", letter: "Z", renumber: true });

    expect(result).toEqual({ success: true, message: "Letter changed to Z; 2 product codes renamed", letter: "Z", renamedCount: 2 });
    const products = readCollection(PRODUCTS);
    expect(products[0].productCode).toBe("Z001");
    expect(products[1].productCode).toBe("Z012");
    expect(products[2].productCode).toBe("CUSTOM-7");
    expect(products[3].productCode).toBe("A002");
    expect(products[4].productCode).toBeUndefined();
  });

  it("avoids product code collisions across categories when renumbering", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G" },
    ]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" }),
      buildProductDoc({ productId: "prod-2", productType: "geodes", productCode: "G001" }),
    ]);

    await updateCategoryLetter({ key: "acorns", letter: "G", renumber: true });

    const products = readCollection(PRODUCTS);
    expect(products[0].productCode).toBe("G002");
    expect(products[1].productCode).toBe("G001");
  });

  it("keeps existing numbers when the new letter has no conflicts", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" }),
      buildProductDoc({ productId: "prod-2", productType: "acorns", productCode: "A002" }),
    ]);

    await updateCategoryLetter({ key: "acorns", letter: "G", renumber: true });

    const products = readCollection(PRODUCTS);
    expect(products[0].productCode).toBe("G001");
    expect(products[1].productCode).toBe("G002");
  });

  it("uses singular wording when exactly one product code is renamed", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" })]);

    const result = await updateCategoryLetter({ key: "acorns", letter: "B", renumber: true });
    expect(result.message).toBe("Letter changed to B; 1 product code renamed");
  });

  it("leaves the category letter unchanged when renaming product codes fails", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" })]);

    const updateSpy = vi.spyOn(FakeDbModel.prototype, "updateObjItem").mockImplementation(async () => {
      throw new Error("write failed");
    });
    const result = await updateCategoryLetter({ key: "acorns", letter: "B", renumber: true });
    updateSpy.mockRestore();

    expect(result).toEqual({ success: false, message: "Failed to rename product codes; letter not changed" });
    expect(readCollection(CATEGORIES)[0].letter).toBe("A");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("A001");
  });

  it("reports the letter unchanged when the same letter is submitted", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productType: "acorns", productCode: "A001" })]);

    const result = await updateCategoryLetter({ key: "acorns", letter: "a", renumber: true });

    expect(result).toEqual({ success: true, message: "Letter unchanged", letter: "A", renamedCount: 0 });
    expect(readCollection(PRODUCTS)[0].productCode).toBe("A001");
  });

  it("rejects an unknown category", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await updateCategoryLetter({ key: "nope", letter: "B" });
    expect(result).toEqual({ success: false, message: "Category not found" });
  });

  it("rejects a missing key or an invalid letter", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    expect((await updateCategoryLetter({ letter: "B" })).success).toBe(false);
    expect((await updateCategoryLetter({ key: "acorns", letter: "BB" })).success).toBe(false);
    expect((await updateCategoryLetter({ key: "acorns", letter: "" })).success).toBe(false);
    expect(readCollection(CATEGORIES)[0].letter).toBe("A");
  });
});

//---------- updateCategoryTitle ----------

describe("updateCategoryTitle", () => {
  it("renames the title and leaves the key and letter alone", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);

    const result = await updateCategoryTitle({ key: "acorns", title: "  Oak Acorns  " });

    expect(result).toEqual({ success: true, message: 'Category renamed to "Oak Acorns"', title: "Oak Acorns" });
    const saved = readCollection(CATEGORIES)[0];
    expect(saved.key).toBe("acorns");
    expect(saved.title).toBe("Oak Acorns");
    expect(saved.letter).toBe("A");
  });

  it("reports the title unchanged when the same title is submitted", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await updateCategoryTitle({ key: "acorns", title: "Acorns" });
    expect(result).toEqual({ success: true, message: "Title unchanged", title: "Acorns" });
  });

  it("rejects an unknown category", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    const result = await updateCategoryTitle({ key: "nope", title: "Anything" });
    expect(result).toEqual({ success: false, message: "Category not found" });
  });

  it("rejects a missing key, an empty title, or a title over 60 characters", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    expect((await updateCategoryTitle({ title: "X" })).success).toBe(false);
    expect((await updateCategoryTitle({ key: "acorns", title: "   " })).success).toBe(false);
    expect((await updateCategoryTitle({ key: "acorns", title: "x".repeat(61) })).success).toBe(false);
    expect(readCollection(CATEGORIES)[0].title).toBe("Acorns");
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

//---------- findCategory ----------

describe("findCategory", () => {
  it("returns the category for a known productType", async () => {
    seedCollection(CATEGORIES, [{ key: "wallPieces", title: "Wall Pieces", letter: "W" }]);
    const category = await findCategory("wallPieces");
    expect(category).toMatchObject({ key: "wallPieces", title: "Wall Pieces", letter: "W" });
  });

  it("returns null for an unknown productType", async () => {
    seedCollection(CATEGORIES, [{ key: "wallPieces", title: "Wall Pieces", letter: "W" }]);
    expect(await findCategory("nope")).toBeNull();
  });

  it("returns null for a blank productType", async () => {
    expect(await findCategory("")).toBeNull();
    expect(await findCategory(undefined)).toBeNull();
  });
});

//---------- buildNextProductCode ----------

describe("buildNextProductCode", () => {
  it("returns <LETTER>001 when no product uses that letter yet", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    expect(await buildNextProductCode("acorns")).toBe("A001");
  });

  it("uses the category's stored letter, not its title", async () => {
    seedCollection(CATEGORIES, [{ key: "samaltman", title: "SamAltman", letter: "Q" }]);
    expect(await buildNextProductCode("samaltman")).toBe("Q001");
  });

  it("returns the next number after the highest existing one", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productCode: "A001" }),
      buildProductDoc({ productId: "prod-2", productCode: "A007" }),
    ]);
    expect(await buildNextProductCode("acorns")).toBe("A008");
  });

  it("shares one running sequence between categories with the same letter", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "animals", title: "Animals", letter: "A" },
    ]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A003", productType: "acorns" })]);
    expect(await buildNextProductCode("animals")).toBe("A004");
  });

  it("ignores productCodes that don't match the letter pattern, other letters, or missing productCode", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "B" },
    ]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productCode: "a-1" }),
      buildProductDoc({ productId: "prod-2", productCode: "B003" }),
      buildProductDoc({ productId: "prod-3", productCode: undefined }),
    ]);
    expect(await buildNextProductCode("acorns")).toBe("A001");
  });

  it("matches the letter case-insensitively when scanning existing productCodes", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "a005" })]);
    expect(await buildNextProductCode("acorns")).toBe("A006");
  });

  it("grows past 3 digits naturally once the max reaches 999", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A999" })]);
    expect(await buildNextProductCode("acorns")).toBe("A1000");
  });

  it("returns null for an unknown category", async () => {
    expect(await buildNextProductCode("nope")).toBeNull();
  });

  it("returns null when the category has no valid letter", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns" }]);
    expect(await buildNextProductCode("acorns")).toBeNull();
  });
});

//---------- findProductCodeOwner ----------

describe("findProductCodeOwner", () => {
  it("finds the owning product case-insensitively and with surrounding whitespace trimmed", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    const owner = await findProductCodeOwner("  a001  ");
    expect(owner.productId).toBe("prod-1");
  });

  it("excludes the product identified by excludeProductId", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    const owner = await findProductCodeOwner("A001", "prod-1");
    expect(owner).toBeNull();
  });

  it("still finds a different product's matching productCode when excluding another id", async () => {
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "prod-1", productCode: "A001" }),
      buildProductDoc({ productId: "prod-2", productCode: "A001" }),
    ]);
    const owner = await findProductCodeOwner("A001", "prod-2");
    expect(owner.productId).toBe("prod-1");
  });

  it("returns null for a blank productCode", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    expect(await findProductCodeOwner("")).toBeNull();
    expect(await findProductCodeOwner("   ")).toBeNull();
  });

  it("returns null when nothing matches", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "prod-1", productCode: "A001" })]);
    expect(await findProductCodeOwner("Z999")).toBeNull();
  });
});
