import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../middleware/db-config.js", () => ({
  dbConnect: vi.fn(),
  dbGet: vi.fn(),
}));

import { dbGet } from "../middleware/db-config.js";
import dbModel from "../models/db-model.js";

const fakeCollection = {
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  findOne: vi.fn(),
  deleteOne: vi.fn(),
  find: vi.fn(),
};

const setFindResults = (docs) => {
  const chain = {
    sort: () => chain,
    limit: () => chain,
    toArray: async () => docs,
  };
  fakeCollection.find.mockReturnValue(chain);
};

beforeEach(() => {
  fakeCollection.insertOne.mockReset();
  fakeCollection.updateOne.mockReset();
  fakeCollection.findOne.mockReset();
  fakeCollection.deleteOne.mockReset();
  fakeCollection.find.mockReset();
  dbGet.mockReturnValue({ collection: () => fakeCollection });
});

describe("storeAny", () => {
  it("inserts the data object as-is", async () => {
    fakeCollection.insertOne.mockResolvedValue({ insertedId: "x1" });
    const model = new dbModel({ name: "Painting", price: 100 }, "products");

    const result = await model.storeAny();

    expect(result.insertedId).toBe("x1");
    expect(fakeCollection.insertOne).toHaveBeenCalledWith({ name: "Painting", price: 100 });
  });
});

describe("updateObjItem", () => {
  it("strips $-prefixed keys from the update object (operator injection)", async () => {
    fakeCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
    const model = new dbModel(
      { keyToLookup: "productId", itemValue: "p1", updateObj: { name: "New", $where: "1===1", $inc: { price: -100 } } },
      "products"
    );

    await model.updateObjItem();

    const [filter, update] = fakeCollection.updateOne.mock.calls[0];
    expect(filter).toEqual({ productId: "p1" });
    expect(update).toEqual({ $set: { name: "New" } });
  });

  it("sanitizes an injected lookup value", async () => {
    fakeCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
    const model = new dbModel({ keyToLookup: "productId", itemValue: { $gt: "" }, updateObj: { name: "New" } }, "products");

    await model.updateObjItem();

    const [filter] = fakeCollection.updateOne.mock.calls[0];
    expect(typeof filter.productId).toBe("string");
  });
});

describe("getUniqueItem", () => {
  it("looks up by key with a sanitized value", async () => {
    const doc = { productId: "p1", name: "Painting" };
    fakeCollection.findOne.mockResolvedValue(doc);
    const model = new dbModel({ keyToLookup: "productId", itemValue: { $ne: null } }, "products");

    const result = await model.getUniqueItem();

    expect(result).toBe(doc);
    const [filter] = fakeCollection.findOne.mock.calls[0];
    expect(typeof filter.productId).toBe("string");
  });
});

describe("getMaxId", () => {
  it("returns the numeric max value of the key", async () => {
    setFindResults([{ orderNumber: "41" }]);
    const model = new dbModel({ keyToLookup: "orderNumber" }, "orders");

    expect(await model.getMaxId()).toBe(41);
  });

  it("returns null for an empty collection", async () => {
    setFindResults([]);
    const model = new dbModel({ keyToLookup: "orderNumber" }, "orders");

    expect(await model.getMaxId()).toBe(null);
  });

  it("returns null when the key is not a string", async () => {
    const model = new dbModel({ keyToLookup: { $bad: 1 } }, "orders");

    expect(await model.getMaxId()).toBe(null);
    expect(fakeCollection.find).not.toHaveBeenCalled();
  });
});

describe("deleteItem", () => {
  it("deletes by key with a sanitized value", async () => {
    fakeCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const model = new dbModel({ keyToLookup: "email", itemValue: { $ne: "" } }, "subscribers");

    await model.deleteItem();

    const [filter] = fakeCollection.deleteOne.mock.calls[0];
    expect(typeof filter.email).toBe("string");
  });
});

describe("matchMultiItems", () => {
  it("matches on all three sanitized key/value pairs", async () => {
    fakeCollection.findOne.mockResolvedValue({ _id: "c1" });
    const model = new dbModel(
      {
        keyToLookup1: "firstName",
        keyToLookup2: "lastName",
        keyToLookup3: "email",
        itemValue1: "Bob",
        itemValue2: "Buyer",
        itemValue3: { $gt: "" },
      },
      "customers"
    );

    await model.matchMultiItems();

    const [filter] = fakeCollection.findOne.mock.calls[0];
    expect(filter.firstName).toBe("Bob");
    expect(filter.lastName).toBe("Buyer");
    expect(typeof filter.email).toBe("string");
  });
});
