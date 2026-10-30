// Subcategories live on their parent category doc as an ordered { key, title, letter? } array.
// Products point at one through productSubType. A lettered subcategory's products take that
// product-code prefix instead of the category's; deleting a subcategory never touches products.

import { describe, it, expect, vi } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

import {
  addSubcategory,
  updateSubcategoryTitle,
  updateSubcategoryLetter,
  updateCategoryLetter,
  moveSubcategory,
  deleteSubcategory,
  buildCategoryList,
  buildNextProductCode,
} from "../src/categories.js";
import { addSubcategoryControl, editProductControl, addNewProductControl, updateSubcategoryLetterControl, nextProductCodeControl } from "../controllers/data-controller.js"; //prettier-ignore
import { seedCollection, readCollection } from "./helpers/fake-db.js";
import { buildReq, buildProductDoc } from "./helpers/mock-req.js";

const CATEGORIES = process.env.CATEGORIES_COLLECTION;
const PRODUCTS = process.env.PRODUCTS_COLLECTION;

const EARRINGS = { key: "earrings", title: "Earrings" };
const NECKLACES = { key: "necklaces", title: "Necklaces" };
const RINGS = { key: "rings", title: "Rings" };

const seedWearableArt = (subcategories) => {
  seedCollection(CATEGORIES, [{ key: "wearableArt", title: "Wearable Art", letter: "WA", sortOrder: 0, subcategories }]);
};

const readSubcategories = () => {
  return readCollection(CATEGORIES)[0].subcategories;
};

const buildRes = () => {
  return { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn(), sendFile: vi.fn() };
};

//---------- addSubcategory ----------

describe("addSubcategory", () => {
  it("adds a subcategory with a camelCase key to a category that had none", async () => {
    seedCollection(CATEGORIES, [{ key: "wearableArt", title: "Wearable Art", letter: "WA" }]);

    const result = await addSubcategory({ categoryKey: "wearableArt", title: "  Hair Clips  " });

    expect(result.success).toBe(true);
    expect(readSubcategories()).toEqual([{ key: "hairClips", title: "Hair Clips" }]);
  });

  it("appends new subcategories after the existing ones", async () => {
    seedWearableArt([EARRINGS]);

    await addSubcategory({ categoryKey: "wearableArt", title: "Necklaces" });

    expect(readSubcategories()).toEqual([EARRINGS, NECKLACES]);
  });

  it("rejects a duplicate subcategory name in the same category", async () => {
    seedWearableArt([EARRINGS]);

    const result = await addSubcategory({ categoryKey: "wearableArt", title: "earrings" });

    expect(result).toEqual({ success: false, message: "Subcategory already exists" });
    expect(readSubcategories()).toEqual([EARRINGS]);
  });

  it("allows the same subcategory name under two different categories", async () => {
    seedCollection(CATEGORIES, [
      { key: "wearableArt", title: "Wearable Art", letter: "WA", subcategories: [EARRINGS] },
      { key: "other", title: "Other", letter: "O" },
    ]);

    const result = await addSubcategory({ categoryKey: "other", title: "Earrings" });

    expect(result.success).toBe(true);
    expect(readCollection(CATEGORIES)[1].subcategories).toEqual([EARRINGS]);
  });

  it('rejects the reserved name "all"', async () => {
    seedWearableArt([]);
    const result = await addSubcategory({ categoryKey: "wearableArt", title: "All" });
    expect(result).toEqual({ success: false, message: 'Subcategory name "all" is reserved' });
  });

  it("rejects an empty title", async () => {
    seedWearableArt([]);
    const result = await addSubcategory({ categoryKey: "wearableArt", title: "   " });
    expect(result).toEqual({ success: false, message: "Title is required" });
  });

  it("rejects a title longer than 60 characters", async () => {
    seedWearableArt([]);
    const result = await addSubcategory({ categoryKey: "wearableArt", title: "x".repeat(61) });
    expect(result).toEqual({ success: false, message: "Title must be 60 characters or fewer" });
  });

  it("rejects a title with no letters or numbers", async () => {
    seedWearableArt([]);
    const result = await addSubcategory({ categoryKey: "wearableArt", title: "!!!" });
    expect(result.success).toBe(false);
    expect(readSubcategories()).toEqual([]);
  });

  it("fails when the category does not exist", async () => {
    seedWearableArt([]);
    const result = await addSubcategory({ categoryKey: "missing", title: "Earrings" });
    expect(result).toEqual({ success: false, message: "Category not found" });
  });

  it("fails when no category key is given", async () => {
    const result = await addSubcategory({ title: "Earrings" });
    expect(result).toEqual({ success: false, message: "No category key provided" });
  });

  it("stores an optional letter uppercased", async () => {
    seedWearableArt([]);

    const result = await addSubcategory({ categoryKey: "wearableArt", title: "Earrings", letter: " er " });

    expect(result.success).toBe(true);
    expect(readSubcategories()).toEqual([{ key: "earrings", title: "Earrings", letter: "ER" }]);
  });

  it("rejects an invalid letter without adding the subcategory", async () => {
    seedWearableArt([]);

    const result = await addSubcategory({ categoryKey: "wearableArt", title: "Earrings", letter: "E1" });

    expect(result).toEqual({ success: false, message: "Letter must be 1-3 letters A-Z" });
    expect(readSubcategories()).toEqual([]);
  });
});

//---------- updateSubcategoryLetter ----------

describe("updateSubcategoryLetter", () => {
  const seedEarringProducts = () => {
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt", productSubType: "earrings" }),
      buildProductDoc({ productId: "p2", productCode: "WA002", productType: "wearableArt", productSubType: "necklaces" }),
      buildProductDoc({ productId: "p3", productCode: "CUSTOM", productType: "wearableArt", productSubType: "earrings" }),
    ]);
  };

  const readCodes = () => {
    const codes = [];
    const products = readCollection(PRODUCTS);
    for (let i = 0; i < products.length; i++) codes.push(products[i].productCode);
    return codes;
  };

  it("sets a letter without touching product codes when renumber is off", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);
    seedEarringProducts();

    const result = await updateSubcategoryLetter({ categoryKey: "wearableArt", subcategoryKey: "earrings", letter: "e" });

    expect(result).toEqual({ success: true, message: "Letter changed to E", letter: "E", renamedCount: 0 });
    expect(readSubcategories()).toEqual([{ ...EARRINGS, letter: "E" }, NECKLACES]);
    expect(readCodes()).toEqual(["WA001", "WA002", "CUSTOM"]);
  });

  it("renumber renames only that subcategory's category-prefix codes", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);
    seedEarringProducts();

    const result = await updateSubcategoryLetter({ categoryKey: "wearableArt", subcategoryKey: "earrings", letter: "E", renumber: true });

    expect(result.renamedCount).toBe(1);
    expect(readCodes()).toEqual(["E001", "WA002", "CUSTOM"]);
  });

  it("clearing the letter with renumber moves codes back to the category prefix", async () => {
    seedWearableArt([{ ...EARRINGS, letter: "E" }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productCode: "E004", productType: "wearableArt", productSubType: "earrings" })]);

    const result = await updateSubcategoryLetter({ categoryKey: "wearableArt", subcategoryKey: "earrings", letter: "", renumber: true });

    expect(result.success).toBe(true);
    expect(readSubcategories()).toEqual([EARRINGS]);
    expect(readCodes()).toEqual(["WA004"]);
  });

  it("rejects an invalid letter and leaves the subcategory alone", async () => {
    seedWearableArt([EARRINGS]);

    const result = await updateSubcategoryLetter({ categoryKey: "wearableArt", subcategoryKey: "earrings", letter: "ABCD" });

    expect(result).toEqual({ success: false, message: "Letter must be 1-3 letters A-Z" });
    expect(readSubcategories()).toEqual([EARRINGS]);
  });

  it("fails for an unknown subcategory", async () => {
    seedWearableArt([EARRINGS]);
    const result = await updateSubcategoryLetter({ categoryKey: "wearableArt", subcategoryKey: "rings", letter: "R" });
    expect(result).toEqual({ success: false, message: "Subcategory not found" });
  });
});

//---------- updateCategoryLetter with subcategories ----------

describe("updateCategoryLetter with subcategories", () => {
  it("renumber skips a subcategory whose own letter is the old category letter", async () => {
    seedWearableArt([{ ...EARRINGS, letter: "WA" }, NECKLACES, { ...RINGS, letter: "R" }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt", productSubType: "earrings" }),
      buildProductDoc({ productId: "p2", productCode: "WA002", productType: "wearableArt", productSubType: "necklaces" }),
      buildProductDoc({ productId: "p3", productCode: "WA003", productType: "wearableArt", productSubType: "rings" }),
      buildProductDoc({ productId: "p4", productCode: "WA004", productType: "wearableArt" }),
    ]);

    const result = await updateCategoryLetter({ key: "wearableArt", letter: "X", renumber: true });

    const codes = [];
    const products = readCollection(PRODUCTS);
    for (let i = 0; i < products.length; i++) codes.push(products[i].productCode);
    expect(result.renamedCount).toBe(3);
    expect(codes).toEqual(["WA001", "X002", "X003", "X004"]);
  });
});

//---------- updateSubcategoryTitle ----------

describe("updateSubcategoryTitle", () => {
  it("renames the title and keeps the key products point at", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);

    const result = await updateSubcategoryTitle({ categoryKey: "wearableArt", subcategoryKey: "earrings", title: "Ear Cuffs" });

    expect(result.success).toBe(true);
    expect(readSubcategories()).toEqual([{ key: "earrings", title: "Ear Cuffs" }, NECKLACES]);
  });

  it("reports an unchanged title without failing", async () => {
    seedWearableArt([EARRINGS]);
    const result = await updateSubcategoryTitle({ categoryKey: "wearableArt", subcategoryKey: "earrings", title: "Earrings" });
    expect(result).toEqual({ success: true, message: "Title unchanged", title: "Earrings" });
  });

  it("fails for an unknown subcategory", async () => {
    seedWearableArt([EARRINGS]);
    const result = await updateSubcategoryTitle({ categoryKey: "wearableArt", subcategoryKey: "rings", title: "Rings" });
    expect(result).toEqual({ success: false, message: "Subcategory not found" });
  });

  it("rejects an empty title and leaves the name alone", async () => {
    seedWearableArt([EARRINGS]);
    const result = await updateSubcategoryTitle({ categoryKey: "wearableArt", subcategoryKey: "earrings", title: "" });
    expect(result).toEqual({ success: false, message: "Title is required" });
    expect(readSubcategories()).toEqual([EARRINGS]);
  });
});

//---------- moveSubcategory ----------

describe("moveSubcategory", () => {
  it("moves a subcategory up one place", async () => {
    seedWearableArt([EARRINGS, NECKLACES, RINGS]);

    const result = await moveSubcategory({ categoryKey: "wearableArt", subcategoryKey: "rings", direction: "up" });

    expect(result.success).toBe(true);
    expect(readSubcategories()).toEqual([EARRINGS, RINGS, NECKLACES]);
  });

  it("moves a subcategory down one place", async () => {
    seedWearableArt([EARRINGS, NECKLACES, RINGS]);

    await moveSubcategory({ categoryKey: "wearableArt", subcategoryKey: "earrings", direction: "down" });

    expect(readSubcategories()).toEqual([NECKLACES, EARRINGS, RINGS]);
  });

  it("refuses to move the first subcategory up", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);

    const result = await moveSubcategory({ categoryKey: "wearableArt", subcategoryKey: "earrings", direction: "up" });

    expect(result).toEqual({ success: false, message: "Subcategory cannot move further" });
    expect(readSubcategories()).toEqual([EARRINGS, NECKLACES]);
  });

  it("refuses to move the last subcategory down", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);
    const result = await moveSubcategory({ categoryKey: "wearableArt", subcategoryKey: "necklaces", direction: "down" });
    expect(result.success).toBe(false);
  });

  it("rejects a direction other than up or down", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);
    const result = await moveSubcategory({ categoryKey: "wearableArt", subcategoryKey: "earrings", direction: "sideways" });
    expect(result).toEqual({ success: false, message: "Direction must be up or down" });
  });
});

//---------- deleteSubcategory ----------

describe("deleteSubcategory", () => {
  it("removes only the chosen subcategory", async () => {
    seedWearableArt([EARRINGS, NECKLACES, RINGS]);

    const result = await deleteSubcategory({ categoryKey: "wearableArt", subcategoryKey: "necklaces" });

    expect(result).toEqual({ success: true, message: "Subcategory deleted successfully" });
    expect(readSubcategories()).toEqual([EARRINGS, RINGS]);
  });

  it("leaves products that used the deleted subcategory unchanged", async () => {
    seedWearableArt([EARRINGS]);
    const product = buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt", productSubType: "earrings" });
    seedCollection(PRODUCTS, [product]);

    await deleteSubcategory({ categoryKey: "wearableArt", subcategoryKey: "earrings" });

    expect(readCollection(PRODUCTS)).toEqual([product]);
  });

  it("fails for an unknown subcategory", async () => {
    seedWearableArt([EARRINGS]);
    const result = await deleteSubcategory({ categoryKey: "wearableArt", subcategoryKey: "rings" });
    expect(result).toEqual({ success: false, message: "Subcategory not found" });
  });
});

//---------- category list + product codes ----------

describe("buildCategoryList", () => {
  it("includes each category's subcategories in order with their product counts", async () => {
    seedWearableArt([NECKLACES, EARRINGS]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productType: "wearableArt", productSubType: "earrings" }),
      buildProductDoc({ productId: "p2", productType: "wearableArt", productSubType: "earrings" }),
      buildProductDoc({ productId: "p3", productType: "other", productSubType: "necklaces" }),
    ]);

    const list = await buildCategoryList();

    expect(list[0].subcategories).toEqual([
      { ...NECKLACES, productCount: 0 },
      { ...EARRINGS, productCount: 2 },
    ]);
  });
});

describe("buildNextProductCode", () => {
  it("numbers unlettered subcategories by the parent category letter", async () => {
    seedWearableArt([EARRINGS, NECKLACES]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt", productSubType: "earrings" }),
      buildProductDoc({ productId: "p2", productCode: "WA002", productType: "wearableArt", productSubType: "necklaces" }),
    ]);

    expect(await buildNextProductCode("wearableArt")).toBe("WA003");
    expect(await buildNextProductCode("wearableArt", "earrings")).toBe("WA003");
  });

  it("uses a lettered subcategory's own prefix and sequence", async () => {
    seedWearableArt([{ ...EARRINGS, letter: "E" }, NECKLACES]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt" }),
      buildProductDoc({ productId: "p2", productCode: "E007", productType: "wearableArt", productSubType: "earrings" }),
    ]);

    expect(await buildNextProductCode("wearableArt", "earrings")).toBe("E008");
    expect(await buildNextProductCode("wearableArt", "necklaces")).toBe("WA002");
  });

  it("falls back to the category prefix for a deleted subcategory key", async () => {
    seedWearableArt([]);
    expect(await buildNextProductCode("wearableArt", "earrings")).toBe("WA001");
  });
});

//---------- controllers ----------

describe("addSubcategoryControl", () => {
  it("adds the subcategory and ignores fields outside the whitelist", async () => {
    seedWearableArt([]);
    const res = buildRes();

    await addSubcategoryControl(buildReq({ body: { categoryKey: "wearableArt", title: "Earrings", key: "injected" } }), res);

    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(readSubcategories()).toEqual([EARRINGS]);
  });
});

describe("updateSubcategoryLetterControl", () => {
  it("passes the letter through and treats renumber 'true' as true", async () => {
    seedWearableArt([EARRINGS]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productCode: "WA001", productType: "wearableArt", productSubType: "earrings" })]);
    const res = buildRes();

    await updateSubcategoryLetterControl(buildReq({ body: { categoryKey: "wearableArt", subcategoryKey: "earrings", letter: "E", renumber: "true" } }), res);

    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(readSubcategories()).toEqual([{ ...EARRINGS, letter: "E" }]);
    expect(readCollection(PRODUCTS)[0].productCode).toBe("E001");
  });
});

describe("nextProductCodeControl", () => {
  it("suggests a code from the chosen subcategory's letter", async () => {
    seedWearableArt([{ ...EARRINGS, letter: "E" }]);
    seedCollection(PRODUCTS, []);
    const res = buildRes();

    await nextProductCodeControl(buildReq({ body: { productType: "wearableArt", productSubType: "earrings" } }), res);

    expect(res.json).toHaveBeenCalledWith({ productCode: "E001" });
  });
});

describe("addNewProductControl auto code", () => {
  it("assigns a blank product code from its lettered subcategory", async () => {
    seedWearableArt([{ ...EARRINGS, letter: "E" }]);
    seedCollection(PRODUCTS, []);
    const res = buildRes();

    await addNewProductControl(buildReq({ body: { name: "Hoop", price: "20", productType: "wearableArt", productSubType: "earrings" } }), res);

    expect(readCollection(PRODUCTS)[0].productCode).toBe("E001");
  });
});

describe("editProductControl", () => {
  it("saves the product's subcategory", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", urlName: "acorn-necklace", productType: "wearableArt" })]);
    const res = buildRes();

    await editProductControl(buildReq({ body: { productId: "p1", productSubType: "necklaces" } }), res);

    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(readCollection(PRODUCTS)[0].productSubType).toBe("necklaces");
  });

  it("rejects a non-string subcategory and leaves the product unchanged", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", urlName: "acorn-necklace", productSubType: "rings" })]);
    const res = buildRes();

    await editProductControl(buildReq({ body: { productId: "p1", productSubType: { $ne: "" } } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(readCollection(PRODUCTS)[0].productSubType).toBe("rings");
  });

  it("rejects an over-long subcategory", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", urlName: "acorn-necklace" })]);
    const res = buildRes();

    await editProductControl(buildReq({ body: { productId: "p1", productSubType: "x".repeat(101) } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("addNewProductControl", () => {
  it("rejects a non-string subcategory without storing the product", async () => {
    seedCollection(PRODUCTS, []);
    const res = buildRes();

    await addNewProductControl(buildReq({ body: { name: "Ring", price: "20", productSubType: ["rings"] } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(readCollection(PRODUCTS)).toEqual([]);
  });
});

//---------- public filter ----------

describe("filterProductsBySubcategory", () => {
  it("keeps only products in the chosen subcategory, or all of them for all", async () => {
    const { filterProductsBySubcategory } = await import("../public/js/helpers/products-run.js");
    const earring = { productId: "p1", productSubType: "earrings" };
    const necklace = { productId: "p2", productSubType: "necklaces" };
    const unsorted = { productId: "p3" };

    expect(filterProductsBySubcategory([earring, necklace, unsorted], "earrings")).toEqual([earring]);
    expect(filterProductsBySubcategory([earring, necklace, unsorted], "all")).toEqual([earring, necklace, unsorted]);
  });
});
