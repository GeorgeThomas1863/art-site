// src/shipping.js prices shipping via ShipEngine, then applies house rules (+2 days, +$2, no envelopes)
// and stores the result in the session so checkout can never trust a client-sent rate.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("axios", () => {
  return { default: { get: vi.fn(), post: vi.fn() } };
});

import axios from "axios";
import {
  fetchShippingRates,
  applyShippingAdjustments,
  getUSPS,
  getShippingFromSession,
  clearShippingFromSession,
  updateSelectedRate,
} from "../src/shipping.js";
import { seedCollection } from "./helpers/fake-db.js";
import { buildReq, buildProductDoc } from "./helpers/mock-req.js";

const PRODUCTS = process.env.PRODUCTS_COLLECTION;

//---------- fixtures ----------

const CARRIERS_RESPONSE = {
  data: {
    carriers: [
      { carrier_id: "se-ups", friendly_name: "UPS" },
      { carrier_id: "se-usps", friendly_name: "USPS" },
    ],
  },
};

const buildRate = (overrides = {}) => {
  return {
    carrier_friendly_name: "USPS",
    service_type: "USPS Priority Mail",
    package_type: "package",
    shipping_amount: { amount: 10, currency: "usd" },
    delivery_days: 2,
    estimated_delivery_date: "2026-08-18",
    ...overrides,
  };
};

const mockCarriersAndRates = (rateArray) => {
  axios.get.mockResolvedValue(CARRIERS_RESPONSE);
  axios.post.mockResolvedValue({ data: rateArray });
};

beforeEach(() => {
  seedCollection(PRODUCTS, [
    buildProductDoc({ productId: "ship-1", weight: 1, length: 10, width: 4, height: 3 }),
    buildProductDoc({ productId: "ship-2", weight: 2.5, length: 6, width: 8, height: 2 }),
    buildProductDoc({ productId: "pickup-1", canShip: "no", weight: 50, length: 40, width: 40, height: 40 }),
  ]);
});

//---------- pure adjustments ----------

describe("applyShippingAdjustments", () => {
  it("adds 2 delivery days, $2, and pushes the estimated date 2 days out", async () => {
    const [rate] = await applyShippingAdjustments([buildRate()]);
    expect(rate.delivery_days).toBe(4);
    expect(rate.shipping_amount.amount).toBe(12);
    expect(rate.estimated_delivery_date).toBe("2026-08-20");
  });

  it("crosses month boundaries correctly", async () => {
    const [rate] = await applyShippingAdjustments([buildRate({ estimated_delivery_date: "2026-08-31" })]);
    expect(rate.estimated_delivery_date).toBe("2026-09-02");
  });

  it("leaves missing fields alone", async () => {
    const [rate] = await applyShippingAdjustments([{ shipping_amount: { amount: 5 } }]);
    expect(rate).toEqual({ shipping_amount: { amount: 7 } });
  });

  it("returns non-array input unchanged", async () => {
    expect(await applyShippingAdjustments(null)).toBeNull();
  });
});

//---------- carrier lookup ----------

describe("getUSPS", () => {
  it("returns the carrier_id whose friendly_name is USPS", async () => {
    axios.get.mockResolvedValue(CARRIERS_RESPONSE);
    expect(await getUSPS()).toBe("se-usps");
    expect(axios.get.mock.calls[0][0]).toBe("https://api.shipengine.test/v1/carriers");
    expect(axios.get.mock.calls[0][1].headers["API-Key"]).toBe("fake-shipengine-key");
  });

  it("returns null when USPS is not connected", async () => {
    axios.get.mockResolvedValue({ data: { carriers: [{ carrier_id: "se-ups", friendly_name: "UPS" }] } });
    expect(await getUSPS()).toBeNull();
  });
});

//---------- rate fetching ----------

describe("fetchShippingRates — input guards", () => {
  it("fails without zip or productArray", async () => {
    expect((await fetchShippingRates(buildReq({ body: {} }))).success).toBe(false);
    expect((await fetchShippingRates(buildReq({ body: { zip: "22150" } }))).success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("rejects a malformed ZIP before calling ShipEngine", async () => {
    const req = buildReq({ body: { zip: "ABCDE", productArray: [{ productId: "ship-1", quantity: 1 }] } });
    const result = await fetchShippingRates(req);
    expect(result).toEqual({ success: false, message: "Invalid ZIP code format" });
    expect(axios.get).not.toHaveBeenCalled();
  });
});

describe("fetchShippingRates — pickup-only carts", () => {
  it("returns a synthetic $0 Pickup rate and never calls ShipEngine", async () => {
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "pickup-1", quantity: 2 }] } });

    const result = await fetchShippingRates(req);

    expect(result.success).toBe(true);
    expect(result.allPickup).toBe(true);
    expect(result.rateData[0]).toMatchObject({ carrier_friendly_name: "Pickup", shipping_amount: { amount: 0 } });
    expect(req.session.shipping.selectedRate.carrier_friendly_name).toBe("Pickup");
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("treats unknown products as non-shippable", async () => {
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ghost", quantity: 1 }] } });
    const result = await fetchShippingRates(req);
    expect(result.allPickup).toBe(true);
  });
});

describe("fetchShippingRates — package math", () => {
  it("sums weight by quantity and takes the max of each dimension, ignoring pickup-only items", async () => {
    mockCarriersAndRates([buildRate()]);
    const req = buildReq({
      body: {
        zip: "22150",
        productArray: [
          { productId: "ship-1", quantity: 2 }, // 2 lb, 10x4x3
          { productId: "ship-2", quantity: 1 }, // 2.5 lb, 6x8x2
          { productId: "pickup-1", quantity: 1 }, // ignored
        ],
      },
    });

    await fetchShippingRates(req);

    const sent = axios.post.mock.calls[0][1];
    expect(sent.weight).toEqual({ value: 4.5, unit: "pound" });
    expect(sent.dimensions).toEqual({ unit: "inch", length: 10, width: 8, height: 3 });
    expect(sent.from_postal_code).toBe(process.env.SHIPPING_ZIP);
    expect(sent.to_postal_code).toBe("22150");
    expect(sent.carrier_ids).toEqual(["se-usps"]);
    expect(axios.post.mock.calls[0][0]).toBe("https://api.shipengine.test/v1/rates/estimate");
  });

  it("scales width and height down so girth never exceeds 100 inches", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "big", weight: 1, length: 10, width: 40, height: 30 })]);
    mockCarriersAndRates([buildRate()]);
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "big", quantity: 1 }] } });

    await fetchShippingRates(req);

    const { width, height } = axios.post.mock.calls[0][1].dimensions;
    expect(2 * (width + height)).toBeCloseTo(100, 5);
    expect(width / height).toBeCloseTo(40 / 30, 5);
  });

  it("skips products with a non-positive or non-numeric quantity", async () => {
    mockCarriersAndRates([buildRate()]);
    const req = buildReq({
      body: {
        zip: "22150",
        productArray: [
          { productId: "ship-1", quantity: 0 },
          { productId: "ship-2", quantity: "x" },
          { productId: "ship-1", quantity: 1 },
        ],
      },
    });

    await fetchShippingRates(req);

    expect(axios.post.mock.calls[0][1].weight.value).toBe(1);
  });
});

describe("fetchShippingRates — rate processing", () => {
  it("applies house adjustments and stores adjusted rates in the session", async () => {
    mockCarriersAndRates([buildRate({ shipping_amount: { amount: 10 }, delivery_days: 2 })]);
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    const result = await fetchShippingRates(req);

    expect(result.success).toBe(true);
    expect(result.rateData[0].shipping_amount.amount).toBe(12);
    expect(result.rateData[0].delivery_days).toBe(4);
    expect(req.session.shipping.rateData).toBe(result.rateData);
    expect(req.session.shipping.zip).toBe("22150");
  });

  it("drops envelope and media-mail services by package type or name", async () => {
    mockCarriersAndRates([
      buildRate({ service_type: "USPS Priority Mail", package_type: "package" }),
      buildRate({ service_type: "USPS Priority Mail Flat Rate Envelope", package_type: "flat_rate_envelope" }),
      buildRate({ service_type: "USPS Media Mail", package_type: "package" }),
      buildRate({ service_type: "USPS First Class", package_type: "large_envelope_or_flat" }),
      buildRate({ service_type: "USPS Ground Advantage", package_type: "package" }),
    ]);
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    const result = await fetchShippingRates(req);

    const names = result.rateData.map((rate) => rate.service_type);
    expect(names).toEqual(["USPS Priority Mail", "USPS Ground Advantage"]);
  });

  it("re-numbers rateId sequentially after filtering so client selections map back to session rates", async () => {
    mockCarriersAndRates([
      buildRate({ service_type: "Envelope Thing", package_type: "letter" }),
      buildRate({ service_type: "A" }),
      buildRate({ service_type: "B" }),
    ]);
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    const result = await fetchShippingRates(req);

    expect(result.rateData.map((rate) => rate.rateId)).toEqual([0, 1]);
  });

  it("pre-selects the cheapest surviving rate", async () => {
    mockCarriersAndRates([
      buildRate({ service_type: "Fast", shipping_amount: { amount: 30 } }),
      buildRate({ service_type: "Cheap", shipping_amount: { amount: 5 } }),
      buildRate({ service_type: "Envelope Cheapest", package_type: "letter", shipping_amount: { amount: 1 } }),
    ]);
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    await fetchShippingRates(req);

    expect(req.session.shipping.selectedRate.service_type).toBe("Cheap");
    expect(req.session.shipping.selectedRate.shipping_amount.amount).toBe(7);
  });

  it("returns a failure (not a throw) when ShipEngine errors", async () => {
    axios.get.mockResolvedValue(CARRIERS_RESPONSE);
    axios.post.mockRejectedValue(new Error("502"));
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    const result = await fetchShippingRates(req);

    expect(result).toEqual({ success: false, message: "Failed to calculate shipping rate" });
    expect(req.session.shipping).toBeUndefined();
  });

  it("returns a failure when USPS is not available on the account", async () => {
    axios.get.mockResolvedValue({ data: { carriers: [] } });
    const req = buildReq({ body: { zip: "22150", productArray: [{ productId: "ship-1", quantity: 1 }] } });

    const result = await fetchShippingRates(req);

    expect(result).toEqual({ success: false, message: "Failed to get USPS carrier data" });
    expect(axios.post).not.toHaveBeenCalled();
  });
});

//---------- session helpers ----------

describe("getShippingFromSession / clearShippingFromSession", () => {
  it("returns the session shipping object or a failure when absent", async () => {
    const shipping = { zip: "22150", rateData: [] };
    expect(await getShippingFromSession(buildReq({ session: { shipping } }))).toEqual({ success: true, shipping });
    expect((await getShippingFromSession(buildReq())).success).toBe(false);
  });

  it("clears shipping from the session", async () => {
    const req = buildReq({ session: { shipping: { zip: "22150" } } });
    await clearShippingFromSession(req);
    expect(req.session.shipping).toBeNull();
  });
});

describe("updateSelectedRate", () => {
  const sessionRates = [buildRate({ rateId: 0, service_type: "A", shipping_amount: { amount: 12 } }), buildRate({ rateId: 1, service_type: "B", shipping_amount: { amount: 20 } })];

  it("selects the server-side rate for the given rateId, ignoring the client's price", async () => {
    const req = buildReq({
      session: { shipping: { rateData: sessionRates } },
      body: { selectedRate: { rateId: 1, service_type: "B", shipping_amount: { amount: 0.01 } } },
    });

    const result = await updateSelectedRate(req);

    expect(result.success).toBe(true);
    expect(req.session.shipping.selectedRate).toBe(sessionRates[1]);
    expect(req.session.shipping.selectedRate.shipping_amount.amount).toBe(20);
  });

  it("rejects a rateId that is not in the session", async () => {
    const req = buildReq({ session: { shipping: { rateData: sessionRates } }, body: { selectedRate: { rateId: 9 } } });
    const result = await updateSelectedRate(req);
    expect(result).toEqual({ success: false, message: "Invalid rate selection" });
  });

  it("rejects selection when shipping was never calculated", async () => {
    const req = buildReq({ body: { selectedRate: { rateId: 0 } } });
    const result = await updateSelectedRate(req);
    expect(result.success).toBe(false);
  });

  it("rejects a missing selectedRate", async () => {
    const req = buildReq({ session: { shipping: { rateData: sessionRates } }, body: {} });
    expect((await updateSelectedRate(req)).success).toBe(false);
  });

  it("builds a fixed $0 pickup rate server-side when the client picks Pickup", async () => {
    const req = buildReq({ body: { selectedRate: { carrier_friendly_name: "Pickup", shipping_amount: { amount: 99 } } } });

    const result = await updateSelectedRate(req);

    expect(result.success).toBe(true);
    expect(req.session.shipping.selectedRate).toEqual({
      carrier_friendly_name: "Pickup",
      service_type: "Local Pickup",
      shipping_amount: { amount: 0, currency: "usd" },
      delivery_days: null,
      estimated_delivery_date: null,
    });
  });
});
