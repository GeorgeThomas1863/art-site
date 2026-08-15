// Proves the test harness itself: env is fake, DB is fake, Square is fake.
// If this file fails, every other test is suspect.

import { describe, it, expect } from "vitest";
import dbModel from "../models/db-model.js";
import SQ from "../middleware/square-config.js";
import { FakeDbModel, seedCollection, readCollection } from "./helpers/fake-db.js";

describe("test harness", () => {
  it("uses fake env values, never real ones", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.MONGO_URI).toBe("mongodb://fake");
    expect(process.env.MAILGUN_API_KEY).toBe("fake-mailgun-key");
    expect(process.env.SQUARE_TOKEN).toBe("fake-square-token");
  });

  it("replaces models/db-model.js with the in-memory FakeDbModel", () => {
    expect(dbModel).toBe(FakeDbModel);
  });

  it("round-trips a document through the fake DB", async () => {
    seedCollection("products", [{ productId: "p1", price: 10 }]);
    const model = new dbModel({ keyToLookup: "productId", itemValue: "p1" }, "products");
    const doc = await model.getUniqueItem();
    expect(doc.price).toBe(10);

    const storeModel = new dbModel({ productId: "p2", price: 20 }, "products");
    const result = await storeModel.storeAny();
    expect(result.insertedId).toMatch(/^fake-id-/);
    expect(readCollection("products")).toHaveLength(2);
  });

  it("starts each test with an empty fake DB", () => {
    expect(readCollection("products")).toHaveLength(0);
  });

  it("replaces the Square client with a stub", () => {
    expect(typeof SQ.payments.create).toBe("function");
    expect(SQ.payments.create.mock).toBeDefined();
  });
});
