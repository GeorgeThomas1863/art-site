// src/cart.js keeps the cart in req.session and pulls prices from the DB.
// The key property: the client can never set a price — only a productId and quantity.

import { describe, it, expect, beforeEach } from "vitest";
import { buildCart, addCartItem, getCartStats, updateCartItem, removeCartItem } from "../src/cart.js";
import { seedCollection } from "./helpers/fake-db.js";
import { buildReq, buildCartItem, buildProductDoc } from "./helpers/mock-req.js";

const PRODUCTS = process.env.PRODUCTS_COLLECTION;

beforeEach(() => {
  seedCollection(PRODUCTS, [
    buildProductDoc({ productId: "prod-1", productCode: "A-1", name: "Acorn Necklace", price: 25 }),
    buildProductDoc({ productId: "prod-2", productCode: "B-2", name: "Geode", price: 40, canShip: "no", weight: 2 }),
  ]);
});

describe("buildCart", () => {
  it("creates an empty cart on the session when none exists", async () => {
    const req = buildReq();
    const cart = await buildCart(req);
    expect(cart).toEqual([]);
    expect(req.session.cart).toBe(cart);
  });

  it("returns the existing cart untouched", async () => {
    const existing = [buildCartItem()];
    const req = buildReq({ session: { cart: existing } });
    expect(await buildCart(req)).toBe(existing);
  });
});

describe("addCartItem", () => {
  it("adds a product using the DB price, ignoring any client-supplied price", async () => {
    const req = buildReq({ body: { data: { productId: "prod-1", quantity: 2, price: 0.01 } } });
    const result = await addCartItem(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0]).toMatchObject({ productId: "prod-1", name: "Acorn Necklace", price: 25, quantity: 2 });
  });

  it("returns itemCount that includes the item just added", async () => {
    const req = buildReq({ body: { data: { productId: "prod-1", quantity: 3 } } });
    const result = await addCartItem(req);
    expect(result.itemCount).toBe(3);
  });

  it("merges quantity when the same product is added twice and refreshes the price from DB", async () => {
    const req = buildReq({ session: { cart: [buildCartItem({ productId: "prod-1", quantity: 1, price: 999 })] } });
    req.body = { data: { productId: "prod-1", quantity: 2 } };

    const result = await addCartItem(req);

    expect(req.session.cart).toHaveLength(1);
    expect(req.session.cart[0].quantity).toBe(3);
    expect(req.session.cart[0].price).toBe(25);
    expect(result.itemCount).toBe(3);
  });

  it("copies shipping dimensions and canShip from the product", async () => {
    const req = buildReq({ body: { data: { productId: "prod-2", quantity: 1 } } });
    await addCartItem(req);
    expect(req.session.cart[0]).toMatchObject({ canShip: "no", weight: 2, length: 4, width: 3, height: 2 });
  });

  it("rejects an unknown product", async () => {
    const req = buildReq({ body: { data: { productId: "nope", quantity: 1 } } });
    const result = await addCartItem(req);
    expect(result).toEqual({ success: false, message: "Product not found" });
    expect(req.session.cart).toEqual([]);
  });

  it("rejects zero, negative, and non-numeric quantities", async () => {
    for (const quantity of [0, -1, "abc", undefined]) {
      const req = buildReq({ body: { data: { productId: "prod-1", quantity } } });
      const result = await addCartItem(req);
      expect(result.success).toBe(false);
      expect(req.session.cart).toEqual([]);
    }
  });

  it("does not let a NoSQL operator object act as a productId", async () => {
    const req = buildReq({ body: { data: { productId: { $ne: null }, quantity: 1 } } });
    const result = await addCartItem(req);
    expect(result.success).toBe(false);
  });
});

describe("getCartStats", () => {
  it("sums quantity and price*quantity across the cart", async () => {
    const req = buildReq({
      session: {
        cart: [buildCartItem({ price: 25, quantity: 2 }), buildCartItem({ productId: "prod-2", price: 40, quantity: 1 })],
      },
    });
    const stats = await getCartStats(req);
    expect(stats).toEqual({ itemCount: 3, total: 90, success: true });
  });

  it("returns zeros for an empty or missing cart", async () => {
    const req = buildReq();
    expect(await getCartStats(req)).toEqual({ itemCount: 0, total: 0, success: true });
  });
});

describe("updateCartItem", () => {
  const seedTwoItems = () => [
    buildCartItem({ productId: "prod-1", quantity: 1 }),
    buildCartItem({ productId: "prod-2", quantity: 4 }),
  ];

  it("sets the new quantity on the matching item", async () => {
    const req = buildReq({ session: { cart: seedTwoItems() }, body: { productId: "prod-2", quantity: 7 } });
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(req.session.cart[1].quantity).toBe(7);
    expect(req.session.cart[0].quantity).toBe(1);
  });

  it("stores quantity as a number even when the client sends a numeric string", async () => {
    const req = buildReq({ session: { cart: seedTwoItems() }, body: { productId: "prod-1", quantity: "5" } });
    await updateCartItem(req);
    expect(req.session.cart[0].quantity).toBe(5);
  });

  it("removes the item when quantity is zero or negative", async () => {
    for (const quantity of [0, -3]) {
      const req = buildReq({ session: { cart: seedTwoItems() }, body: { productId: "prod-1", quantity } });
      const result = await updateCartItem(req);
      expect(result.success).toBe(true);
      expect(req.session.cart.map((item) => item.productId)).toEqual(["prod-2"]);
    }
  });

  it("returns success with the cart unchanged when the product is not in the cart (regression: used to throw ReferenceError)", async () => {
    const req = buildReq({ session: { cart: seedTwoItems() }, body: { productId: "prod-99", quantity: 2 } });
    const result = await updateCartItem(req);
    expect(result).toEqual({ success: true, cart: req.session.cart });
    expect(req.session.cart).toHaveLength(2);
  });

  it("rejects a non-numeric quantity instead of writing garbage into the cart", async () => {
    const req = buildReq({ session: { cart: seedTwoItems() }, body: { productId: "prod-1", quantity: "lots" } });
    const result = await updateCartItem(req);
    expect(result.success).toBe(false);
    expect(req.session.cart[0].quantity).toBe(1);
  });

  it("rejects a missing productId", async () => {
    const req = buildReq({ session: { cart: seedTwoItems() }, body: { quantity: 2 } });
    const result = await updateCartItem(req);
    expect(result.success).toBe(false);
  });
});

describe("removeCartItem", () => {
  it("removes only the matching product", async () => {
    const req = buildReq({
      session: { cart: [buildCartItem({ productId: "prod-1" }), buildCartItem({ productId: "prod-2" })] },
      body: { productId: "prod-1" },
    });
    const result = await removeCartItem(req);
    expect(result.success).toBe(true);
    expect(req.session.cart.map((item) => item.productId)).toEqual(["prod-2"]);
  });

  it("fails without a productId", async () => {
    const req = buildReq({ session: { cart: [buildCartItem()] }, body: {} });
    const result = await removeCartItem(req);
    expect(result.success).toBe(false);
    expect(req.session.cart).toHaveLength(1);
  });
});
