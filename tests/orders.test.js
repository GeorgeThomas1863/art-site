import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  storeAny: vi.fn(),
  getMaxId: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
    getMaxId() {
      return dbMocks.getMaxId(this.dataObject);
    }
  },
}));

vi.mock("../src/payments.js", () => ({ processPayment: vi.fn() }));
vi.mock("../src/mailer.js", () => ({ sendMail: vi.fn() }));
vi.mock("../src/customer.js", () => ({ storeCustomerData: vi.fn() }));

import { placeNewOrder, getOrderNumber, sendOrderConfirmationEmails } from "../src/orders.js";
import { processPayment } from "../src/payments.js";
import { sendMail } from "../src/mailer.js";
import { storeCustomerData } from "../src/customer.js";

process.env.TAX_RATE = "0.08";
process.env.ORDERS_COLLECTION = "orders-test";
process.env.EMAIL_USER = "shop@test.com";
process.env.EMAIL_RECIPIENT_1 = "admin@test.com";
delete process.env.EMAIL_RECIPIENT_2;

// Cart subtotal: 10 × 2 + 5.55 = 25.55 → tax 2.04 → with $7.99 shipping, total 35.58
const buildOrderReq = () => ({
  session: {
    cart: [
      { productId: "p1", itemId: 101, name: "Blue Painting", price: 10, quantity: 2, canShip: "yes" },
      { productId: "p2", itemId: 102, name: "Small Mug", price: 5.55, quantity: 1, canShip: "no" },
    ],
    shipping: {
      selectedRate: {
        carrier_friendly_name: "USPS",
        service_type: "Ground",
        shipping_amount: { amount: 7.99, currency: "usd" },
        delivery_days: 5,
        estimated_delivery_date: "2026-07-22",
      },
    },
  },
  body: {
    route: "/order/place",
    paymentToken: "tok_1",
    firstName: "Bob",
    lastName: "Buyer",
    email: "buyer@test.com",
    address: "2 Oak St",
    city: "Atlanta",
    state: "GA",
    zip: "30301",
  },
});

const squarePayment = {
  id: "pay_1",
  orderId: "sq_1",
  status: "COMPLETED",
  createdAt: "2026-07-16T12:00:00Z",
  approvedMoney: { amount: 3558n, currency: "USD" },
  billingAddress: { addressLine1: "2 Oak St" },
  receiptNumber: "R123",
  riskEvaluation: { riskLevel: "NORMAL" },
};

const setupHappyPath = () => {
  processPayment.mockResolvedValue({ success: true, payment: squarePayment });
  dbMocks.getMaxId.mockResolvedValue(41);
  dbMocks.storeAny.mockResolvedValue({ insertedId: "abc123" });
  storeCustomerData.mockResolvedValue({});
  sendMail.mockResolvedValue({ messageId: "m1" });
};

beforeEach(() => {
  processPayment.mockReset();
  sendMail.mockReset();
  storeCustomerData.mockReset();
  dbMocks.storeAny.mockReset();
  dbMocks.getMaxId.mockReset();
});

describe("placeNewOrder guards", () => {
  it("fails when the cart is empty", async () => {
    const req = buildOrderReq();
    req.session.cart = [];
    expect(await placeNewOrder(req)).toEqual({ success: false, message: "Cart is empty" });
  });

  it("fails when no shipping rate is selected", async () => {
    const req = buildOrderReq();
    req.session.shipping = null;
    expect(await placeNewOrder(req)).toEqual({ success: false, message: "No shipping rate selected" });
  });
});

describe("placeNewOrder money math", () => {
  it("charges Square the exact total in cents (subtotal + shipping + 8% tax)", async () => {
    setupHappyPath();
    const req = buildOrderReq();

    const result = await placeNewOrder(req);

    expect(result.success).toBe(true);
    expect(processPayment).toHaveBeenCalledTimes(1);
    expect(processPayment.mock.calls[0][0]).toBe(3558);
    expect(result.data).toMatchObject({
      itemCost: 25.55,
      shippingCost: 7.99,
      tax: 2.04,
      totalCost: 35.58,
    });
  });

  it("returns order identifiers from the stored order and payment", async () => {
    setupHappyPath();

    const result = await placeNewOrder(buildOrderReq());

    expect(result.data.orderId).toBe("abc123");
    expect(result.data.receiptNumber).toBe("R123");
    expect(result.data.paymentStatus).toBe("COMPLETED");
  });
});

describe("placeNewOrder order storage", () => {
  it("stores the order with the next order number and no payment token", async () => {
    setupHappyPath();

    await placeNewOrder(buildOrderReq());

    expect(dbMocks.storeAny).toHaveBeenCalledTimes(1);
    const storedOrder = dbMocks.storeAny.mock.calls[0][0];
    expect(storedOrder.orderNumber).toBe(42);
    expect(storedOrder.customerData.paymentToken).toBeUndefined();
    expect(storedOrder.customerData.route).toBeUndefined();
    expect(storedOrder.customerData.email).toBe("buyer@test.com");
    expect(storedOrder.amountPaid).toBe(35.58);
    expect(storedOrder.risk).toBe("NORMAL");
    expect(storedOrder.shippingDetails.carrier).toBe("USPS");
  });

  it("clears the cart and shipping session after a successful order", async () => {
    setupHappyPath();
    const req = buildOrderReq();

    await placeNewOrder(req);

    expect(req.session.cart).toEqual([]);
    expect(req.session.shipping).toBe(null);
  });
});

describe("placeNewOrder failure paths", () => {
  it("fails and keeps the cart when the payment is declined", async () => {
    setupHappyPath();
    processPayment.mockResolvedValue(null);
    const req = buildOrderReq();

    const result = await placeNewOrder(req);

    expect(result).toEqual({ success: false, message: "Failed to process payment" });
    expect(dbMocks.storeAny).not.toHaveBeenCalled();
    expect(req.session.cart).toHaveLength(2);
  });

  it("fails gracefully when the payment call throws", async () => {
    setupHappyPath();
    processPayment.mockRejectedValue(new Error("square down"));

    const result = await placeNewOrder(buildOrderReq());

    expect(result).toEqual({ success: false, message: "Failed to place order" });
  });

  it("fails when the order cannot be stored", async () => {
    setupHappyPath();
    dbMocks.storeAny.mockResolvedValue({});

    const result = await placeNewOrder(buildOrderReq());

    expect(result).toEqual({ success: false, message: "Failed to store order data" });
  });

  it("fails when customer data cannot be stored", async () => {
    setupHappyPath();
    storeCustomerData.mockResolvedValue(null);

    const result = await placeNewOrder(buildOrderReq());

    expect(result).toEqual({ success: false, message: "Failed to store customer data" });
  });

  it("still succeeds when confirmation emails fail — payment already went through", async () => {
    setupHappyPath();
    sendMail.mockRejectedValue(new Error("mailgun down"));
    const req = buildOrderReq();

    const result = await placeNewOrder(req);

    expect(result.success).toBe(true);
    expect(req.session.cart).toEqual([]);
  });
});

describe("getOrderNumber", () => {
  it("starts at 1 when no orders exist", async () => {
    dbMocks.getMaxId.mockResolvedValue(null);
    expect(await getOrderNumber()).toBe(1);
  });

  it("increments the current max order number", async () => {
    dbMocks.getMaxId.mockResolvedValue(41);
    expect(await getOrderNumber()).toBe(42);
  });
});

describe("sendOrderConfirmationEmails", () => {
  const buildOrderData = () => ({
    orderNumber: 42,
    receiptNumber: "R123",
    orderDate: "2026-07-16T12:00:00Z",
    itemCost: 25.55,
    shippingCost: 9.99,
    tax: 2.04,
    totalCost: 37.58,
    amountPaid: 37.58,
    currency: "USD",
    paymentId: "pay_1",
    squareOrderId: "sq_1",
    risk: "NORMAL",
    billingAddress: { addressLine1: "1 Main St", locality: "Atlanta", administrativeDistrictLevel1: "GA", postalCode: "30301", country: "US" },
    items: [{ itemId: 101, name: "<b>Blue</b> Painting", price: 25.55, quantity: 1, canShip: "yes" }],
    customerData: {
      firstName: "Bob\r\nBcc: evil@x.com",
      lastName: "Buyer",
      email: "buyer@test.com",
      address: "2 Oak St",
      city: "Atlanta",
      state: "GA",
      zip: "30301",
    },
    shippingDetails: { carrier: "USPS", serviceType: "Ground", deliveryDays: 5, estimatedDelivery: "2026-07-22", cost: 9.99 },
  });

  it("sends buyer and admin emails to the right recipients", async () => {
    sendMail.mockResolvedValue({ messageId: "m1" });

    const result = await sendOrderConfirmationEmails(buildOrderData());

    expect(result).toEqual({ buyerSent: true, adminSent: true });
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].to).toBe("buyer@test.com");
    expect(sendMail.mock.calls[1][0].to).toBe("admin@test.com");
  });

  it("escapes HTML in user-provided data and strips newlines from the admin subject", async () => {
    sendMail.mockResolvedValue({ messageId: "m1" });

    await sendOrderConfirmationEmails(buildOrderData());

    const buyerEmail = sendMail.mock.calls[0][0];
    expect(buyerEmail.html).toContain("&lt;b&gt;Blue&lt;/b&gt; Painting");
    expect(buyerEmail.html).not.toContain("<b>Blue</b>");

    const adminEmail = sendMail.mock.calls[1][0];
    expect(adminEmail.subject).not.toMatch(/[\r\n]/);
  });

  it("reports partial failure when one email bounces", async () => {
    sendMail.mockRejectedValueOnce(new Error("buyer bounce")).mockResolvedValueOnce({ messageId: "m2" });

    const result = await sendOrderConfirmationEmails(buildOrderData());

    expect(result).toEqual({ buyerSent: false, adminSent: true });
  });
});
