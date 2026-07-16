import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getUniqueItem: vi.fn(),
}));

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    getUniqueItem() {
      return dbMocks.getUniqueItem(this.dataObject);
    }
  },
}));

vi.mock("axios", () => ({
  default: { get: axiosMocks.get, post: axiosMocks.post },
}));

import { fetchShippingRates, applyShippingAdjustments, getUSPS, getShippingFromSession, clearShippingFromSession, updateSelectedRate } from "../src/shipping.js";

process.env.PRODUCTS_COLLECTION = "products-test";
process.env.SHIP_STATION_BASE_URL = "https://shipstation.test";
process.env.SHIP_STATION_API_KEY = "test-key";
process.env.SHIPPING_ZIP = "30301";

const shippableProduct = {
  productId: "p1",
  canShip: "yes",
  weight: 2,
  length: 10,
  width: 8,
  height: 4,
};

const uspsCarriers = { data: { carriers: [{ friendly_name: "FedEx", carrier_id: "se-9" }, { friendly_name: "USPS", carrier_id: "se-1" }] } };

const buildRateResponse = () => ({
  data: [
    {
      package_type: "package",
      service_type: "USPS Ground Advantage",
      shipping_amount: { amount: 8.4, currency: "usd" },
      delivery_days: 3,
      estimated_delivery_date: "2026-07-20",
    },
    {
      package_type: "flat_rate_envelope",
      service_type: "USPS Flat Rate Envelope",
      shipping_amount: { amount: 5, currency: "usd" },
      delivery_days: 2,
      estimated_delivery_date: "2026-07-19",
    },
    {
      package_type: "package",
      service_type: "USPS Media Mail",
      shipping_amount: { amount: 3, currency: "usd" },
      delivery_days: 5,
      estimated_delivery_date: "2026-07-21",
    },
    {
      package_type: "package",
      service_type: "USPS Priority Mail Express",
      shipping_amount: { amount: 30.1, currency: "usd" },
      delivery_days: 1,
      estimated_delivery_date: "2026-07-18",
    },
  ],
});

const buildReq = (body, session = {}) => ({ body, session });

beforeEach(() => {
  dbMocks.getUniqueItem.mockReset();
  axiosMocks.get.mockReset();
  axiosMocks.post.mockReset();
});

describe("applyShippingAdjustments", () => {
  it("adds 2 delivery days and $2 to each rate", async () => {
    const rates = [{ delivery_days: 3, shipping_amount: { amount: 8.4, currency: "usd" } }];
    const result = await applyShippingAdjustments(rates);
    expect(result[0].delivery_days).toBe(5);
    expect(result[0].shipping_amount.amount).toBeCloseTo(10.4, 10);
  });

  it("adds $2 even when the base amount is zero", async () => {
    const rates = [{ shipping_amount: { amount: 0, currency: "usd" } }];
    const result = await applyShippingAdjustments(rates);
    expect(result[0].shipping_amount.amount).toBe(2);
  });

  it("shifts the estimated delivery date by 2 days, handling month rollover", async () => {
    const rates = [{ estimated_delivery_date: "2026-07-30" }, { estimated_delivery_date: "2026-07-20" }];
    const result = await applyShippingAdjustments(rates);
    expect(result[0].estimated_delivery_date).toBe("2026-08-01");
    expect(result[1].estimated_delivery_date).toBe("2026-07-22");
  });

  it("leaves missing fields alone", async () => {
    const rates = [{ delivery_days: null, estimated_delivery_date: null }];
    const result = await applyShippingAdjustments(rates);
    expect(result[0].delivery_days).toBe(null);
    expect(result[0].estimated_delivery_date).toBe(null);
  });

  it("returns non-array input unchanged", async () => {
    expect(await applyShippingAdjustments(null)).toBe(null);
    expect(await applyShippingAdjustments(undefined)).toBe(undefined);
  });
});

describe("getUSPS", () => {
  it("returns the USPS carrier id", async () => {
    axiosMocks.get.mockResolvedValue(uspsCarriers);
    expect(await getUSPS()).toBe("se-1");
  });

  it("returns null when USPS is not in the carrier list", async () => {
    axiosMocks.get.mockResolvedValue({ data: { carriers: [{ friendly_name: "FedEx", carrier_id: "se-9" }] } });
    expect(await getUSPS()).toBe(null);
  });
});

describe("fetchShippingRates", () => {
  it("fails when zip or productArray is missing", async () => {
    const noZip = await fetchShippingRates(buildReq({ productArray: [] }));
    const noProducts = await fetchShippingRates(buildReq({ zip: "30301" }));
    expect(noZip.success).toBe(false);
    expect(noProducts.success).toBe(false);
  });

  it("fails on an invalid ZIP format", async () => {
    const result = await fetchShippingRates(buildReq({ zip: "1234", productArray: [{ productId: "p1", quantity: 1 }] }));
    expect(result).toEqual({ success: false, message: "Invalid ZIP code format" });
  });

  it("returns a synthetic pickup rate when all items are non-shippable", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ ...shippableProduct, canShip: "no" });
    const req = buildReq({ zip: "30301", productArray: [{ productId: "p1", quantity: 1 }] });

    const result = await fetchShippingRates(req);

    expect(result.success).toBe(true);
    expect(result.allPickup).toBe(true);
    expect(result.rateData).toHaveLength(1);
    expect(result.rateData[0].shipping_amount.amount).toBe(0);
    expect(req.session.shipping.allPickup).toBe(true);
    expect(req.session.shipping.selectedRate.carrier_friendly_name).toBe("Pickup");
    expect(axiosMocks.post).not.toHaveBeenCalled();
  });

  it("fetches rates, filters envelopes, adjusts amounts, and preselects the cheapest", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(shippableProduct);
    axiosMocks.get.mockResolvedValue(uspsCarriers);
    axiosMocks.post.mockResolvedValue(buildRateResponse());
    const req = buildReq({ zip: "90210", productArray: [{ productId: "p1", quantity: 2 }] });

    const result = await fetchShippingRates(req);

    expect(result.success).toBe(true);
    // Envelope and Media Mail rates filtered out
    expect(result.rateData).toHaveLength(2);
    expect(result.rateData[0].rateId).toBe(0);
    expect(result.rateData[1].rateId).toBe(1);
    // +$2 and +2 days applied
    expect(result.rateData[0].shipping_amount.amount).toBeCloseTo(10.4, 10);
    expect(result.rateData[0].delivery_days).toBe(5);
    // Cheapest adjusted rate preselected in session
    expect(req.session.shipping.selectedRate.service_type).toBe("USPS Ground Advantage");
    expect(req.session.shipping.zip).toBe("90210");

    // Request built from DB data: weight 2 × qty 2 = 4, fixed origin zip, USPS carrier
    const [url, params] = axiosMocks.post.mock.calls[0];
    expect(url).toBe("https://shipstation.test/rates/estimate");
    expect(params.carrier_ids).toEqual(["se-1"]);
    expect(params.from_postal_code).toBe("30301");
    expect(params.to_postal_code).toBe("90210");
    expect(params.weight.value).toBe(4);
    expect(params.dimensions).toMatchObject({ length: 10, width: 8, height: 4 });
  });

  it("caps girth at 100 inches by scaling width and height", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ ...shippableProduct, length: 40, width: 30, height: 30 });
    axiosMocks.get.mockResolvedValue(uspsCarriers);
    axiosMocks.post.mockResolvedValue(buildRateResponse());
    const req = buildReq({ zip: "90210", productArray: [{ productId: "p1", quantity: 1 }] });

    await fetchShippingRates(req);

    // girth = 2 × (30 + 30) = 120 → scaled by 100/120 → 25 each
    const params = axiosMocks.post.mock.calls[0][1];
    expect(params.dimensions.width).toBeCloseTo(25, 10);
    expect(params.dimensions.height).toBeCloseTo(25, 10);
    expect(params.dimensions.length).toBe(40);
  });

  it("returns a failure message when the ShipStation call throws", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(shippableProduct);
    axiosMocks.get.mockResolvedValue(uspsCarriers);
    axiosMocks.post.mockRejectedValue(new Error("network down"));
    const req = buildReq({ zip: "90210", productArray: [{ productId: "p1", quantity: 1 }] });

    const result = await fetchShippingRates(req);

    expect(result).toEqual({ success: false, message: "Failed to calculate shipping rate" });
  });

  it("fails when no USPS carrier is available", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(shippableProduct);
    axiosMocks.get.mockResolvedValue({ data: { carriers: [] } });
    const req = buildReq({ zip: "90210", productArray: [{ productId: "p1", quantity: 1 }] });

    const result = await fetchShippingRates(req);

    expect(result).toEqual({ success: false, message: "Failed to get USPS carrier data" });
  });
});

describe("session helpers", () => {
  it("getShippingFromSession returns stored data or a failure", async () => {
    const withData = await getShippingFromSession({ session: { shipping: { zip: "30301" } } });
    expect(withData).toEqual({ success: true, shipping: { zip: "30301" } });

    const withoutData = await getShippingFromSession({ session: {} });
    expect(withoutData.success).toBe(false);
  });

  it("clearShippingFromSession nulls out the session data", async () => {
    const req = { session: { shipping: { zip: "30301" } } };
    const result = await clearShippingFromSession(req);
    expect(result.success).toBe(true);
    expect(req.session.shipping).toBe(null);
  });
});

describe("updateSelectedRate", () => {
  it("fails when no rate is provided", async () => {
    const result = await updateSelectedRate(buildReq({}));
    expect(result.success).toBe(false);
  });

  it("constructs a $0 pickup rate server-side", async () => {
    const req = buildReq({ selectedRate: { carrier_friendly_name: "Pickup", shipping_amount: { amount: 99 } } });

    const result = await updateSelectedRate(req);

    expect(result.success).toBe(true);
    expect(req.session.shipping.selectedRate.shipping_amount.amount).toBe(0);
    expect(req.session.shipping.selectedRate.service_type).toBe("Local Pickup");
  });

  it("fails when no rates exist in the session", async () => {
    const result = await updateSelectedRate(buildReq({ selectedRate: { rateId: 0 } }));
    expect(result).toEqual({ success: false, message: "No shipping rates in session. Calculate shipping first." });
  });

  it("fails on an invalid rateId", async () => {
    const session = { shipping: { rateData: [{ rateId: 0, shipping_amount: { amount: 12 } }] } };
    const result = await updateSelectedRate(buildReq({ selectedRate: { rateId: 5 } }, session));
    expect(result).toEqual({ success: false, message: "Invalid rate selection" });
  });

  it("uses the session rate, ignoring a tampered client-sent amount", async () => {
    const sessionRate = { rateId: 0, service_type: "USPS Ground Advantage", shipping_amount: { amount: 12, currency: "usd" } };
    const session = { shipping: { rateData: [sessionRate] } };
    const req = buildReq({ selectedRate: { rateId: 0, shipping_amount: { amount: 0.01 } } }, session);

    const result = await updateSelectedRate(req);

    expect(result.success).toBe(true);
    expect(req.session.shipping.selectedRate).toBe(sessionRate);
    expect(req.session.shipping.selectedRate.shipping_amount.amount).toBe(12);
  });
});
