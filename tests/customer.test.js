// src/customer.js upserts a customer record after each order and accumulates lifetime totals.
// The bug class this guards against: double-counting or resetting totals on repeat customers.

import { describe, it, expect } from "vitest";
import { storeCustomerData, updateCustomerData } from "../src/customer.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";

const CUSTOMERS = process.env.CUSTOMERS_COLLECTION;

const buildOrderData = (overrides = {}) => {
  return {
    orderId: "order-abc",
    orderDate: "2026-08-15T12:00:00Z",
    amountPaid: 53.5,
    itemCount: 2,
    customerData: {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.test",
      phone: "555-0100",
      address: "1 Main St",
      city: "Springfield",
      state: "VA",
      zip: "22150",
    },
    ...overrides,
  };
};

describe("storeCustomerData — first order", () => {
  it("inserts a new customer with totals equal to this order and backfills customerId", async () => {
    const result = await storeCustomerData(buildOrderData());

    const stored = readCollection(CUSTOMERS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      firstName: "Jane",
      email: "jane@example.test",
      lastOrderId: "order-abc",
      lastAmountPaid: 53.5,
      totalPaid: 53.5,
      totalItemsPurchased: 2,
      totalOrders: 1,
    });
    expect(stored[0].customerId).toBe(stored[0]._id);
    expect(result.customerId).toBe(stored[0]._id);
  });

  it("returns null when given no order data", async () => {
    expect(await storeCustomerData(null)).toBeNull();
  });
});

describe("storeCustomerData — repeat customer", () => {
  it("accumulates totals onto the existing record instead of inserting a second one", async () => {
    seedCollection(CUSTOMERS, [
      {
        _id: "cust-1",
        customerId: "cust-1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.test",
        lastOrderId: "order-old",
        lastAmountPaid: 10,
        totalPaid: 10,
        totalItemsPurchased: 1,
        totalOrders: 1,
      },
    ]);

    await storeCustomerData(buildOrderData({ amountPaid: 53.5, itemCount: 2 }));

    const stored = readCollection(CUSTOMERS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      lastOrderId: "order-abc",
      lastAmountPaid: 53.5,
      totalPaid: 63.5,
      totalItemsPurchased: 3,
      totalOrders: 2,
    });
  });

  it("matches on first name + last name + email together, not email alone", async () => {
    seedCollection(CUSTOMERS, [
      { _id: "cust-1", firstName: "John", lastName: "Doe", email: "jane@example.test", totalPaid: 10, totalOrders: 1 },
    ]);

    await storeCustomerData(buildOrderData());

    expect(readCollection(CUSTOMERS)).toHaveLength(2);
  });

  it("treats missing legacy totals as zero", async () => {
    seedCollection(CUSTOMERS, [{ _id: "cust-1", firstName: "Jane", lastName: "Doe", email: "jane@example.test" }]);

    await storeCustomerData(buildOrderData({ amountPaid: 20, itemCount: 4 }));

    expect(readCollection(CUSTOMERS)[0]).toMatchObject({ totalPaid: 20, totalItemsPurchased: 4, totalOrders: 1 });
  });
});

describe("updateCustomerData", () => {
  it("returns null when the customer does not exist", async () => {
    const result = await updateCustomerData({ firstName: "Nobody", lastName: "Here", email: "x@y.test" });
    expect(result).toBeNull();
  });

  it("returns null when given no input", async () => {
    expect(await updateCustomerData(null)).toBeNull();
  });
});
