// Covers the category display-order feature: the `sortOrder` field on category docs, ascending
// read order in getCategories(), append-at-end assignment in addCategory(), and the
// updateCategoryOrder() bulk reorder operation.

import { describe, it, expect } from "vitest";
import { getCategories, addCategory, updateCategoryOrder, DEFAULT_CATEGORIES } from "../src/categories.js";
import { FakeDbModel, seedCollection, readCollection } from "./helpers/fake-db.js";

// Makes updateObjItem report "no document matched" for one key (as if that doc was deleted
// between the caller's validation read and its write), passing every other key through.
const patchUpdateToMissKey = (missingKey) => {
  const realUpdateObjItem = FakeDbModel.prototype.updateObjItem;
  FakeDbModel.prototype.updateObjItem = async function () {
    if (this.dataObject.itemValue === missingKey) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    return realUpdateObjItem.call(this);
  };
  return () => {
    FakeDbModel.prototype.updateObjItem = realUpdateObjItem;
  };
};

const CATEGORIES = process.env.CATEGORIES_COLLECTION;

//---------- getCategories (order) ----------

describe("getCategories", () => {
  it("returns categories sorted ascending by sortOrder", async () => {
    seedCollection(CATEGORIES, [
      { key: "c", title: "C", letter: "C", sortOrder: 2 },
      { key: "a", title: "A", letter: "A", sortOrder: 0 },
      { key: "b", title: "B", letter: "B", sortOrder: 1 },
    ]);

    const result = await getCategories();
    const keys = [];
    for (const category of result) keys.push(category.key);

    expect(keys).toEqual(["a", "b", "c"]);
  });

  it("keeps categories missing sortOrder at the end, in their original relative order", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 0 },
      { key: "animals", title: "Animals", letter: "F" },
    ]);

    const result = await getCategories();
    const keys = [];
    for (const category of result) keys.push(category.key);

    expect(keys).toEqual(["geodes", "acorns", "animals"]);
  });

  it("seeds DEFAULT_CATEGORIES with sortOrder 0 through 6 on an empty collection", async () => {
    await getCategories();

    const stored = readCollection(CATEGORIES);
    expect(stored).toHaveLength(DEFAULT_CATEGORIES.length);

    const sortOrders = [];
    for (const category of stored) sortOrders.push(category.sortOrder);

    const expected = [];
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) expected.push(i);

    expect(sortOrders).toEqual(expected);
  });
});

//---------- addCategory (order) ----------

describe("addCategory", () => {
  it("assigns the new category sortOrder one higher than the current maximum", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 5 },
    ]);

    const result = await addCategory({ title: "Trinkets", letter: "T" });

    expect(result.success).toBe(true);
    expect(result.category.sortOrder).toBe(6);
    expect(readCollection(CATEGORIES)[2].sortOrder).toBe(6);
  });

  it("backfills missing sortOrder on legacy categories and appends the new one last", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G" },
    ]);

    const result = await addCategory({ title: "Trinkets", letter: "T" });

    expect(result.success).toBe(true);
    const stored = readCollection(CATEGORIES);
    expect(stored[0].sortOrder).toBe(0);
    expect(stored[1].sortOrder).toBe(1);
    expect(stored[2].sortOrder).toBe(2);
  });

  it("fails when a legacy category vanishes before its sortOrder backfill write", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A" },
      { key: "geodes", title: "Geodes", letter: "G" },
    ]);

    const restoreUpdate = patchUpdateToMissKey("geodes");
    try {
      const result = await addCategory({ title: "Trinkets", letter: "T" });
      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to backfill category order");
    } finally {
      restoreUpdate();
    }
  });
});

//---------- updateCategoryOrder ----------

describe("updateCategoryOrder", () => {
  it("persists each category's sortOrder as its index in the given order", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
      { key: "animals", title: "Animals", letter: "F", sortOrder: 2 },
    ]);

    const result = await updateCategoryOrder(["animals", "acorns", "geodes"]);

    expect(result.success).toBe(true);
    expect(typeof result.message).toBe("string");

    const sortOrderByKey = {};
    for (const category of readCollection(CATEGORIES)) sortOrderByKey[category.key] = category.sortOrder;

    expect(sortOrderByKey).toEqual({ animals: 0, acorns: 1, geodes: 2 });
  });

  it("rejects a non-array argument", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 }]);
    const result = await updateCategoryOrder("acorns");
    expect(result.success).toBe(false);
  });

  it("rejects null", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 }]);
    const result = await updateCategoryOrder(null);
    expect(result.success).toBe(false);
  });

  it("rejects an empty array", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
    ]);
    const result = await updateCategoryOrder([]);
    expect(result.success).toBe(false);
  });

  it("rejects an array containing a key that does not exist", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
    ]);
    const result = await updateCategoryOrder(["acorns", "doesNotExist"]);
    expect(result.success).toBe(false);
  });

  it("rejects an array missing one of the existing keys and leaves sortOrder untouched", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
      { key: "animals", title: "Animals", letter: "F", sortOrder: 2 },
    ]);

    const result = await updateCategoryOrder(["acorns", "geodes"]);

    expect(result.success).toBe(false);
    const sortOrderByKey = {};
    for (const category of readCollection(CATEGORIES)) sortOrderByKey[category.key] = category.sortOrder;
    expect(sortOrderByKey).toEqual({ acorns: 0, geodes: 1, animals: 2 });
  });

  it("rejects an array containing duplicate keys and leaves sortOrder untouched", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
    ]);

    const result = await updateCategoryOrder(["acorns", "acorns"]);

    expect(result.success).toBe(false);
    const sortOrderByKey = {};
    for (const category of readCollection(CATEGORIES)) sortOrderByKey[category.key] = category.sortOrder;
    expect(sortOrderByKey).toEqual({ acorns: 0, geodes: 1 });
  });

  it("fails when a key vanishes between validation and its write", async () => {
    seedCollection(CATEGORIES, [
      { key: "acorns", title: "Acorns", letter: "A", sortOrder: 0 },
      { key: "geodes", title: "Geodes", letter: "G", sortOrder: 1 },
    ]);

    const restoreUpdate = patchUpdateToMissKey("geodes");
    try {
      const result = await updateCategoryOrder(["geodes", "acorns"]);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to update category order");
    } finally {
      restoreUpdate();
    }
  });
});
