// src/payments.js is the only place money leaves the customer.
// These tests pin the exact request shape sent to Square — amount in cents as BigInt, our location, the buyer's card token.

import { describe, it, expect, vi } from "vitest";
import SQ from "../middleware/square-config.js";
import { processPayment } from "../src/payments.js";

const buildInputParams = (overrides = {}) => {
  return {
    paymentToken: "cnon:card-nonce-ok",
    address: "1 Main St",
    city: "Springfield",
    state: "VA",
    zip: "22150",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.test",
    ...overrides,
  };
};

const FAKE_PAYMENT_RESPONSE = { payment: { id: "pay_1", status: "COMPLETED", orderId: "ord_1" } };

describe("processPayment", () => {
  it("returns null without calling Square when amount or params are missing", async () => {
    expect(await processPayment(0, buildInputParams())).toBeNull();
    expect(await processPayment(1000, null)).toBeNull();
    expect(SQ.payments.create).not.toHaveBeenCalled();
  });

  it("charges the exact cent amount as a BigInt in USD at our location", async () => {
    SQ.payments.create.mockResolvedValue(FAKE_PAYMENT_RESPONSE);

    await processPayment(5350, buildInputParams());

    const sent = SQ.payments.create.mock.calls[0][0];
    expect(sent.amountMoney.amount).toBe(5350n);
    expect(sent.amountMoney.currency).toBe("USD");
    expect(sent.locationId).toBe(process.env.SQUARE_LOCATION_ID);
    expect(sent.sourceId).toBe("cnon:card-nonce-ok");
    expect(sent.buyerEmailAddress).toBe("jane@example.test");
  });

  it("maps the checkout address into Square's billing address fields", async () => {
    SQ.payments.create.mockResolvedValue(FAKE_PAYMENT_RESPONSE);

    await processPayment(100, buildInputParams());

    const sent = SQ.payments.create.mock.calls[0][0];
    expect(sent.billingAddress).toEqual({
      addressLine1: "1 Main St",
      locality: "Springfield",
      administrativeDistrictLevel1: "VA",
      postalCode: "22150",
      firstName: "Jane",
      lastName: "Doe",
    });
  });

  it("uses a fresh idempotency key per call so retries never collide", async () => {
    SQ.payments.create.mockResolvedValue(FAKE_PAYMENT_RESPONSE);

    await processPayment(100, buildInputParams());
    await processPayment(100, buildInputParams());

    const [first, second] = SQ.payments.create.mock.calls.map((call) => call[0].idempotencyKey);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });

  it("puts a human-readable dollar amount in the note", async () => {
    SQ.payments.create.mockResolvedValue(FAKE_PAYMENT_RESPONSE);

    await processPayment(5350, buildInputParams());

    expect(SQ.payments.create.mock.calls[0][0].note).toBe("Order from Jane Doe — $53.50");
  });

  it("returns the Square response flagged success:true when a payment object comes back", async () => {
    SQ.payments.create.mockResolvedValue(FAKE_PAYMENT_RESPONSE);

    const result = await processPayment(100, buildInputParams());

    expect(result.success).toBe(true);
    expect(result.payment.id).toBe("pay_1");
  });

  it("returns null when Square responds without a payment object", async () => {
    SQ.payments.create.mockResolvedValue({ errors: [{ code: "CARD_DECLINED" }] });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await processPayment(100, buildInputParams());

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("lets a Square SDK exception propagate to the caller (orders.js catches it)", async () => {
    SQ.payments.create.mockRejectedValue(new Error("network down"));

    await expect(processPayment(100, buildInputParams())).rejects.toThrow("network down");
  });
});
