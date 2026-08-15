// src/orders.js is the checkout orchestrator: price the cart, charge the card, store the order,
// upsert the customer, email both parties, clear the session. Payment and mail are mocked;
// the DB is the in-memory fake, so order + customer persistence is exercised for real.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/payments.js", () => ({ processPayment: vi.fn() }));
vi.mock("../src/mailer.js", () => ({ sendMail: vi.fn() }));

import { processPayment } from "../src/payments.js";
import { sendMail } from "../src/mailer.js";
import { placeNewOrder, storeOrderData, getOrderNumber, sendOrderConfirmationEmails } from "../src/orders.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";
import { buildReq, buildCartItem } from "./helpers/mock-req.js";

const ORDERS = process.env.ORDERS_COLLECTION;
const CUSTOMERS = process.env.CUSTOMERS_COLLECTION;

//---------- fixtures ----------

const buildCheckoutBody = (overrides = {}) => {
  return {
    route: "/checkout/place-order",
    paymentToken: "cnon:ok",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.test",
    phone: "555-0100",
    address: "1 Main St",
    city: "Springfield",
    state: "VA",
    zip: "22150",
    ...overrides,
  };
};

const buildUspsRate = (overrides = {}) => {
  return {
    rateId: 0,
    carrier_friendly_name: "USPS",
    service_type: "USPS Priority Mail",
    shipping_amount: { amount: 8.5, currency: "usd" },
    delivery_days: 3,
    estimated_delivery_date: "2026-08-20",
    ...overrides,
  };
};

const PICKUP_RATE = {
  rateId: 0,
  carrier_friendly_name: "Pickup",
  service_type: "In-Store Pickup",
  shipping_amount: { amount: 0, currency: "usd" },
  delivery_days: null,
  estimated_delivery_date: null,
};

const buildSquarePayment = (overrides = {}) => {
  return {
    id: "pay_1",
    orderId: "sq_ord_1",
    status: "COMPLETED",
    createdAt: "2026-08-15T14:00:00Z",
    approvedMoney: { amount: 10390n, currency: "USD" },
    billingAddress: { addressLine1: "1 Main St", locality: "Springfield", administrativeDistrictLevel1: "VA", postalCode: "22150", country: "US" },
    riskEvaluation: { riskLevel: "NORMAL" },
    receiptNumber: "R-1",
    ...overrides,
  };
};

// cart: 25*2 + 40*1 = 90.00 subtotal; shipping 8.50; tax 6% = 5.40; total 103.90 → 10390 cents
const buildCheckoutReq = ({ body, cart, selectedRate } = {}) => {
  return buildReq({
    body: body ?? buildCheckoutBody(),
    session: {
      cart: cart ?? [buildCartItem({ productId: "prod-1", price: 25, quantity: 2 }), buildCartItem({ productId: "prod-2", name: "Geode", price: 40, quantity: 1 })],
      shipping: { selectedRate: selectedRate ?? buildUspsRate() },
    },
  });
};

const mockPaymentSuccess = (paymentOverrides = {}) => {
  processPayment.mockResolvedValue({ success: true, payment: buildSquarePayment(paymentOverrides) });
};

let errorSpy;
beforeEach(() => {
  sendMail.mockResolvedValue({ messageId: "<m@x>" });
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

//---------- guards ----------

describe("placeNewOrder — guards", () => {
  it("rejects a request with no body", async () => {
    const result = await placeNewOrder({ session: {} });
    expect(result).toEqual({ success: false, message: "No input parameters" });
    expect(processPayment).not.toHaveBeenCalled();
  });

  it("rejects an empty cart before charging anything", async () => {
    const req = buildCheckoutReq({ cart: [] });
    const result = await placeNewOrder(req);
    expect(result).toEqual({ success: false, message: "Cart is empty" });
    expect(processPayment).not.toHaveBeenCalled();
  });

  it("rejects checkout when no shipping rate has been selected", async () => {
    const req = buildCheckoutReq();
    req.session.shipping = null;
    const result = await placeNewOrder(req);
    expect(result).toEqual({ success: false, message: "No shipping rate selected" });
    expect(processPayment).not.toHaveBeenCalled();
  });
});

//---------- money ----------

describe("placeNewOrder — pricing", () => {
  it("charges subtotal + shipping + tax, rounded to whole cents", async () => {
    mockPaymentSuccess();
    const req = buildCheckoutReq();

    await placeNewOrder(req);

    expect(processPayment).toHaveBeenCalledTimes(1);
    const [cents, params] = processPayment.mock.calls[0];
    expect(cents).toBe(10390);
    expect(params).toBe(req.body);
  });

  it("charges zero shipping for a pickup-only order", async () => {
    mockPaymentSuccess();
    const req = buildCheckoutReq({ selectedRate: PICKUP_RATE });

    await placeNewOrder(req);

    // 90.00 + 0 + 5.40 = 95.40
    expect(processPayment.mock.calls[0][0]).toBe(9540);
  });

  it("does not accumulate float error on awkward prices", async () => {
    mockPaymentSuccess();
    // 0.1 * 3 = 0.30000000000000004 in JS; tax 6% of 0.30 = 0.018 → 0.02; shipping 0.2 → total 0.52
    const req = buildCheckoutReq({
      cart: [buildCartItem({ price: 0.1, quantity: 3 })],
      selectedRate: buildUspsRate({ shipping_amount: { amount: 0.2, currency: "usd" } }),
    });

    await placeNewOrder(req);

    expect(processPayment.mock.calls[0][0]).toBe(52);
  });
});

//---------- payment failure ----------

describe("placeNewOrder — payment failure", () => {
  it("stores nothing and sends no email when Square declines", async () => {
    processPayment.mockResolvedValue(null);
    const req = buildCheckoutReq();

    const result = await placeNewOrder(req);

    expect(result).toEqual({ success: false, message: "Failed to process payment" });
    expect(readCollection(ORDERS)).toHaveLength(0);
    expect(readCollection(CUSTOMERS)).toHaveLength(0);
    expect(sendMail).not.toHaveBeenCalled();
    expect(req.session.cart).toHaveLength(2);
  });

  it("returns a generic failure when the payment call throws", async () => {
    processPayment.mockRejectedValue(new Error("Square down"));
    const req = buildCheckoutReq();

    const result = await placeNewOrder(req);

    expect(result).toEqual({ success: false, message: "Failed to place order" });
    expect(readCollection(ORDERS)).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();
  });
});

//---------- success path ----------

describe("placeNewOrder — success", () => {
  it("stores the order with pricing, payment, and shipping details", async () => {
    mockPaymentSuccess();
    const req = buildCheckoutReq();

    const result = await placeNewOrder(req);

    expect(result.success).toBe(true);
    const stored = readCollection(ORDERS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      orderNumber: 1,
      itemCount: 3,
      itemCost: 90,
      shippingCost: 8.5,
      tax: 5.4,
      totalCost: 103.9,
      paymentId: "pay_1",
      squareOrderId: "sq_ord_1",
      paymentStatus: "COMPLETED",
      amountPaid: 103.9,
      currency: "USD",
      risk: "NORMAL",
      receiptNumber: "R-1",
      shippingDetails: { carrier: "USPS", serviceType: "USPS Priority Mail", deliveryDays: 3, estimatedDelivery: "2026-08-20", cost: 8.5 },
    });
    expect(stored[0].items).toHaveLength(2);
  });

  it("strips route and paymentToken from the stored customer data", async () => {
    mockPaymentSuccess();
    const req = buildCheckoutReq();

    await placeNewOrder(req);

    const stored = readCollection(ORDERS)[0];
    expect(stored.customerData).not.toHaveProperty("route");
    expect(stored.customerData).not.toHaveProperty("paymentToken");
    expect(stored.customerData).toMatchObject({ firstName: "Jane", email: "jane@example.test", zip: "22150" });
  });

  it("increments the order number from the highest existing order", async () => {
    seedCollection(ORDERS, [{ orderNumber: 41 }, { orderNumber: 7 }]);
    mockPaymentSuccess();

    await placeNewOrder(buildCheckoutReq());

    const numbers = readCollection(ORDERS).map((doc) => doc.orderNumber);
    expect(numbers).toContain(42);
  });

  it("upserts the customer record", async () => {
    mockPaymentSuccess();

    await placeNewOrder(buildCheckoutReq());

    const customers = readCollection(CUSTOMERS);
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({ email: "jane@example.test", totalPaid: 103.9, totalItemsPurchased: 3, totalOrders: 1 });
  });

  it("emails the buyer and the admins", async () => {
    mockPaymentSuccess();

    await placeNewOrder(buildCheckoutReq());

    expect(sendMail).toHaveBeenCalledTimes(2);
    const [buyerMail, adminMail] = sendMail.mock.calls.map((call) => call[0]);

    expect(buyerMail.from).toBe(process.env.EMAIL_USER);
    expect(buyerMail.to).toBe("jane@example.test");
    expect(buyerMail.subject).toBe("Order Confirmation — Receipt #R-1");
    expect(buyerMail.html).toContain("Acorn Necklace");
    expect(buyerMail.html).toContain("Geode");
    expect(buyerMail.html).toContain("$103.90");

    expect(adminMail.to).toBe("admin1@example.test, admin2@example.test");
    expect(adminMail.subject).toBe("New Order — Receipt #R-1 from Jane Doe");
    expect(adminMail.html).toContain("pay_1");
    expect(adminMail.html).toContain("New Order — #1");
  });

  it("clears the cart and shipping from the session", async () => {
    mockPaymentSuccess();
    const req = buildCheckoutReq();

    await placeNewOrder(req);

    expect(req.session.cart).toEqual([]);
    expect(req.session.shipping).toBeNull();
  });

  it("returns the summary the confirmation page needs", async () => {
    mockPaymentSuccess();

    const result = await placeNewOrder(buildCheckoutReq());

    expect(result.message).toBe("Order placed successfully");
    expect(result.data).toMatchObject({
      receiptNumber: "R-1",
      paymentStatus: "COMPLETED",
      itemCost: 90,
      shippingCost: 8.5,
      tax: 5.4,
      totalCost: 103.9,
    });
    expect(result.data.orderId).toMatch(/^fake-id-/);
    expect(result.data.cartData).toHaveLength(2);
    expect(result.data.customerData.email).toBe("jane@example.test");
  });

  it("still succeeds when confirmation email fails, and logs the failure", async () => {
    mockPaymentSuccess();
    sendMail.mockRejectedValue(new Error("Mailgun 500"));
    const req = buildCheckoutReq();

    const result = await placeNewOrder(req);

    expect(result.success).toBe(true);
    expect(readCollection(ORDERS)).toHaveLength(1);
    expect(req.session.cart).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

//---------- email safety ----------

describe("sendOrderConfirmationEmails — injection resistance", () => {
  const buildOrderData = (customerOverrides = {}) => {
    return {
      orderNumber: 5,
      receiptNumber: "R-5",
      orderDate: "2026-08-15T14:00:00Z",
      itemCost: 25,
      shippingCost: 5,
      tax: 1.5,
      totalCost: 31.5,
      amountPaid: 31.5,
      currency: "USD",
      paymentId: "pay_5",
      squareOrderId: "sq_5",
      risk: null,
      billingAddress: null,
      items: [buildCartItem({ name: "<img src=x onerror=alert(1)>" })],
      shippingDetails: { carrier: "USPS", serviceType: "Ground", deliveryDays: 4, estimatedDelivery: "2026-08-21", cost: 5 },
      customerData: {
        firstName: "<script>alert(1)</script>",
        lastName: "Doe\r\nBcc: victim@example.test",
        email: "jane@example.test",
        address: "1 Main St",
        city: "Springfield",
        state: "VA",
        zip: "22150",
        ...customerOverrides,
      },
    };
  };

  it("HTML-escapes customer name and item names in both emails", async () => {
    await sendOrderConfirmationEmails(buildOrderData());

    for (const call of sendMail.mock.calls) {
      const { html } = call[0];
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img src=x");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&lt;img src=x");
    }
  });

  it("strips CR/LF from names before they reach the admin subject line", async () => {
    await sendOrderConfirmationEmails(buildOrderData());

    const adminSubject = sendMail.mock.calls[1][0].subject;
    expect(adminSubject).not.toMatch(/[\r\n]/);
    expect(adminSubject).toContain("DoeBcc: victim@example.test");
  });

  it("reports which sends succeeded independently", async () => {
    sendMail.mockResolvedValueOnce({ messageId: "ok" }).mockRejectedValueOnce(new Error("admin bounce"));

    const result = await sendOrderConfirmationEmails(buildOrderData());

    expect(result).toEqual({ buyerSent: true, adminSent: false });
  });
});

//---------- persistence helpers ----------

describe("getOrderNumber", () => {
  it("returns 1 for an empty orders collection", async () => {
    expect(await getOrderNumber()).toBe(1);
  });

  it("returns max + 1 otherwise", async () => {
    seedCollection(ORDERS, [{ orderNumber: 3 }, { orderNumber: 12 }, { orderNumber: 9 }]);
    expect(await getOrderNumber()).toBe(13);
  });
});

describe("storeOrderData", () => {
  it("returns null for missing input", async () => {
    expect(await storeOrderData(null)).toBeNull();
  });

  it("assigns orderNumber and orderId onto the object it stores", async () => {
    const orderObj = { itemCost: 1 };
    const result = await storeOrderData(orderObj);
    expect(result.orderNumber).toBe(1);
    expect(result.orderId).toMatch(/^fake-id-/);
    expect(readCollection(ORDERS)[0].orderNumber).toBe(1);
  });
});
