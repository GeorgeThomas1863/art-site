import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dbModel class entirely — its top-level `await dbConnect()` never runs.
// Each method forwards its instance's dataObject so tests can inspect what was queried.
const dbMocks = vi.hoisted(() => ({
  instances: [],
  getUniqueItem: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
      dbMocks.instances.push(this);
    }
    getUniqueItem() {
      return dbMocks.getUniqueItem(this.dataObject);
    }
  },
}));

import { buildCart, addCartItem, getCartStats, updateCartItem, removeCartItem } from "../src/cart.js";

process.env.PRODUCTS_COLLECTION = "products-test";

const dbProduct = {
  productId: "p1",
  itemId: 101,
  name: "Blue Painting",
  price: 25.5,
  picData: { url: "blue.jpg" },
  canShip: "yes",
  weight: 3,
  length: 20,
  width: 16,
  height: 2,
};

const buildReq = (cart, body) => {
  const session = {};
  if (cart !== undefined) session.cart = cart;
  return { session, body };
};

beforeEach(() => {
  dbMocks.getUniqueItem.mockReset();
  dbMocks.instances.length = 0;
});

describe("buildCart", () => {
  it("initializes an empty cart on a fresh session", async () => {
    const req = buildReq();
    const cart = await buildCart(req);
    expect(cart).toEqual([]);
    expect(req.session.cart).toEqual([]);
  });

  it("preserves an existing cart", async () => {
    const existing = [{ productId: "p1", quantity: 1 }];
    const req = buildReq(existing);
    const cart = await buildCart(req);
    expect(cart).toBe(existing);
  });
});

describe("addCartItem", () => {
  it("adds a new item built from DB data", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(dbProduct);
    const req = buildReq(undefined, { data: { productId: "p1", quantity: 2 } });

    const result = await addCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0]).toMatchObject({
      productId: "p1",
      itemId: 101,
      name: "Blue Painting",
      price: 25.5,
      quantity: 2,
      canShip: "yes",
      weight: 3,
    });
  });

  it("uses the DB price even if the client sends its own price", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(dbProduct);
    const req = buildReq(undefined, { data: { productId: "p1", quantity: 1, price: 0.01 } });

    await addCartItem(req);

    expect(req.session.cart[0].price).toBe(25.5);
  });

  it("increments quantity and refreshes price for an existing item", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(dbProduct);
    const staleItem = { productId: "p1", name: "Blue Painting", price: 1, quantity: 1 };
    const req = buildReq([staleItem], { data: { productId: "p1", quantity: 3 } });

    const result = await addCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0].quantity).toBe(4);
    expect(req.session.cart[0].price).toBe(25.5);
  });

  it("accepts a numeric string quantity", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(dbProduct);
    const req = buildReq(undefined, { data: { productId: "p1", quantity: "3" } });

    const result = await addCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart[0].quantity).toBe(3);
  });

  it("rejects invalid quantities without hitting the DB", async () => {
    const badQuantities = [0, -1, "abc", null];
    for (const quantity of badQuantities) {
      const req = buildReq(undefined, { data: { productId: "p1", quantity } });
      const result = await addCartItem(req);
      expect(result).toEqual({ success: false, message: "Invalid product ID or quantity" });
    }
    expect(dbMocks.getUniqueItem).not.toHaveBeenCalled();
  });

  it("fails when the product does not exist", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);
    const req = buildReq(undefined, { data: { productId: "ghost", quantity: 1 } });

    const result = await addCartItem(req);

    expect(result).toEqual({ success: false, message: "Product not found" });
    expect(req.session.cart).toHaveLength(0);
  });

  it("sanitizes NoSQL operator injection in productId before the DB lookup", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);
    const req = buildReq(undefined, { data: { productId: { $gt: "" }, quantity: 1 } });

    await addCartItem(req);

    expect(dbMocks.getUniqueItem).toHaveBeenCalledTimes(1);
    const queried = dbMocks.getUniqueItem.mock.calls[0][0];
    expect(typeof queried.itemValue).toBe("string");
  });
});

describe("getCartStats", () => {
  it("sums item count and total across the cart", async () => {
    const cart = [
      { productId: "p1", price: 10, quantity: 2 },
      { productId: "p2", price: 5.55, quantity: 1 },
    ];
    const req = buildReq(cart);

    const result = await getCartStats(req);

    expect(result.success).toBe(true);
    expect(result.itemCount).toBe(3);
    expect(result.total).toBeCloseTo(25.55, 10);
  });

  it("returns zeros for an empty cart", async () => {
    const req = buildReq();
    const result = await getCartStats(req);
    expect(result).toEqual({ itemCount: 0, total: 0, success: true });
  });
});

describe("updateCartItem", () => {
  const cartOfTwo = () => [
    { productId: "p1", price: 10, quantity: 2 },
    { productId: "p2", price: 5, quantity: 1 },
  ];

  it("updates the quantity of an existing item", async () => {
    const req = buildReq(cartOfTwo(), { productId: "p1", quantity: 5 });

    const result = await updateCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart[0].quantity).toBe(5);
  });

  it("removes the item when quantity is zero or less", async () => {
    const req = buildReq(cartOfTwo(), { productId: "p1", quantity: 0 });

    const result = await updateCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0].productId).toBe("p2");
  });

  // KNOWN BUG — src/cart.js:95 returns `res.json(...)` but `res` is not defined
  // in this function, so this path throws a ReferenceError. This test asserts the
  // intended contract (`return { success: true, cart: req.session.cart }`) and
  // fails until that line is fixed.
  it("returns success with the unchanged cart when the product is not in the cart", async () => {
    const req = buildReq(cartOfTwo(), { productId: "ghost", quantity: 5 });

    const result = await updateCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(2);
  });
});

describe("removeCartItem", () => {
  it("removes only the matching item", async () => {
    const cart = [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ];
    const req = buildReq(cart, { productId: "p1" });

    const result = await removeCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0].productId).toBe("p2");
  });

  it("fails when no productId is provided", async () => {
    const req = buildReq([{ productId: "p1", quantity: 1 }], {});
    const result = await removeCartItem(req);
    expect(result).toEqual({ success: false, error: "No product ID" });
  });
});
