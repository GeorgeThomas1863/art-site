import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  matchMultiItems: vi.fn(),
  storeAny: vi.fn(),
  updateObjItem: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    matchMultiItems() {
      return dbMocks.matchMultiItems(this.dataObject);
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
    updateObjItem() {
      return dbMocks.updateObjItem(this.dataObject);
    }
  },
}));

import { storeCustomerData, updateCustomerData } from "../src/customer.js";

process.env.CUSTOMERS_COLLECTION = "customers-test";

const buildOrderData = () => ({
  orderId: "order1",
  orderDate: "2026-07-16T12:00:00Z",
  amountPaid: 35.58,
  itemCount: 3,
  customerData: {
    firstName: "Bob",
    lastName: "Buyer",
    email: "buyer@test.com",
    phone: "555-0100",
    address: "2 Oak St",
    city: "Atlanta",
    state: "GA",
    zip: "30301",
  },
});

beforeEach(() => {
  dbMocks.matchMultiItems.mockReset();
  dbMocks.storeAny.mockReset();
  dbMocks.updateObjItem.mockReset();
});

describe("storeCustomerData", () => {
  it("returns null for missing order data", async () => {
    expect(await storeCustomerData(null)).toBe(null);
  });

  it("creates a new customer with first-order totals and backfills customerId", async () => {
    dbMocks.matchMultiItems.mockResolvedValue(null); // no existing customer
    dbMocks.storeAny.mockResolvedValue({ insertedId: { toString: () => "c1" } });
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeCustomerData(buildOrderData());

    expect(result.customerId).toBe("c1");
    expect(result.totalOrders).toBe(1);
    expect(result.totalPaid).toBe(35.58);
    expect(result.totalItemsPurchased).toBe(3);
    const backfill = dbMocks.updateObjItem.mock.calls[0][0];
    expect(backfill.updateObj).toEqual({ customerId: "c1" });
  });

  it("updates an existing customer instead of creating a duplicate", async () => {
    dbMocks.matchMultiItems.mockResolvedValue({ _id: "mongo1", totalPaid: 100, totalItemsPurchased: 5, totalOrders: 3 });
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await storeCustomerData(buildOrderData());

    expect(result).toBeTruthy();
    expect(dbMocks.storeAny).not.toHaveBeenCalled();
  });
});

describe("updateCustomerData", () => {
  it("returns null when the customer does not exist", async () => {
    dbMocks.matchMultiItems.mockResolvedValue(null);

    const result = await updateCustomerData({ firstName: "Bob", lastName: "Buyer", email: "buyer@test.com" });

    expect(result).toBe(null);
    expect(dbMocks.updateObjItem).not.toHaveBeenCalled();
  });

  it("accumulates lifetime totals onto the existing record", async () => {
    dbMocks.matchMultiItems.mockResolvedValue({ _id: "mongo1", totalPaid: 100, totalItemsPurchased: 5, totalOrders: 3 });
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await updateCustomerData({
      firstName: "Bob",
      lastName: "Buyer",
      email: "buyer@test.com",
      lastOrderId: "order2",
      lastOrderDate: "2026-07-16",
      lastAmountPaid: 35.58,
      totalPaid: 35.58,
      totalItemsPurchased: 3,
    });

    expect(result.totalPaid).toBeCloseTo(135.58, 10);
    expect(result.totalItemsPurchased).toBe(8);
    expect(result.totalOrders).toBe(4);
    expect(result.lastOrderId).toBe("order2");
  });

  it("treats missing legacy totals as zero", async () => {
    dbMocks.matchMultiItems.mockResolvedValue({ _id: "mongo1" }); // legacy record with no totals
    dbMocks.updateObjItem.mockResolvedValue({ modifiedCount: 1 });

    const result = await updateCustomerData({
      firstName: "Bob",
      lastName: "Buyer",
      email: "buyer@test.com",
      lastOrderId: "order2",
      lastOrderDate: "2026-07-16",
      lastAmountPaid: 35.58,
      totalPaid: 35.58,
      totalItemsPurchased: 3,
    });

    expect(result.totalPaid).toBeCloseTo(35.58, 10);
    expect(result.totalItemsPurchased).toBe(3);
    expect(result.totalOrders).toBe(1);
  });
});
