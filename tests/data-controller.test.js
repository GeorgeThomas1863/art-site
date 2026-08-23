// Controller-level status mapping: /api/square-config must fail loud when sandbox lacks its
// IDs (the sandbox SDK rejects prod fallbacks), and /newsletter/add must map validation and
// store failures to the right status codes.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

import axios from "axios";
import {
  getSquareConfigControl,
  addSubscriberControl,
  getCartStatsControl,
  addNewProductControl,
  sendNewsletterControl,
  sendTestNewsletterControl,
  getSiteUrlControl,
  getCategoriesControl,
  addCategoryControl,
  updateCategoryTitleControl,
  updateCategoryLetterControl,
  deleteCategoryControl,
  nextProductCodeControl,
  checkProductCodeControl,
} from "../controllers/data-controller.js";
import { buildReq, buildProductDoc } from "./helpers/mock-req.js";
import { FakeDbModel, seedCollection, readCollection } from "./helpers/fake-db.js";
import { DEFAULT_CATEGORIES } from "../src/categories.js";

const SUBSCRIBERS = process.env.SUBSCRIBERS_COLLECTION;
const PRODUCTS = process.env.PRODUCTS_COLLECTION;
const NEWSLETTERS = process.env.NEWSLETTER_COLLECTION;
const CATEGORIES = process.env.CATEGORIES_COLLECTION;

const buildRes = () => {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
};

beforeEach(() => {
  axios.post.mockResolvedValue({ status: 200, data: { id: "<msg-1@mg.example.test>" } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSquareConfigControl", () => {
  it("returns the public Square identifiers from env", async () => {
    const res = buildRes();
    await getSquareConfigControl(buildReq(), res);
    expect(res.json).toHaveBeenCalledWith({
      appId: process.env.SQUARE_APP_ID,
      locationId: process.env.SQUARE_LOCATION_ID,
      squareEnv: "sandbox",
    });
  });

  it("fails loud instead of pairing sandbox with the prod fallback IDs when SQUARE_APP_ID is unset", async () => {
    vi.stubEnv("SQUARE_APP_ID", "");
    const res = buildRes();
    await getSquareConfigControl(buildReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toMatch(/SQUARE_ENV=sandbox requires/);
  });
});

describe("addSubscriberControl", () => {
  it("stores a new subscriber and returns success", async () => {
    const res = buildRes();
    await addSubscriberControl(buildReq({ body: { email: "new@example.test" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(readCollection(SUBSCRIBERS)).toHaveLength(1);
  });

  it("responds 500 when no email is provided", async () => {
    const res = buildRes();
    await addSubscriberControl(buildReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(readCollection(SUBSCRIBERS)).toHaveLength(0);
  });

  it("responds 400 on an invalid email format", async () => {
    const res = buildRes();
    await addSubscriberControl(buildReq({ body: { email: "not-an-email" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(readCollection(SUBSCRIBERS)).toHaveLength(0);
  });

  it("reports a duplicate instead of storing the email twice", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "dupe@example.test" }]);
    const res = buildRes();
    await addSubscriberControl(buildReq({ body: { email: "dupe@example.test" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ duplicate: true }));
    expect(readCollection(SUBSCRIBERS)).toHaveLength(1);
  });
});

describe("getCartStatsControl", () => {
  it("returns empty stats (not a 500) for a fresh session with no cart yet", async () => {
    const res = buildRes();
    await getCartStatsControl(buildReq({ session: {} }), res);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ itemCount: 0, total: 0, success: true });
  });

  it("sums quantity and price across cart items", async () => {
    const session = { cart: [{ price: 60, quantity: 1 }, { price: 25, quantity: 2 }] };
    const res = buildRes();
    await getCartStatsControl(buildReq({ session }), res);
    expect(res.json).toHaveBeenCalledWith({ itemCount: 3, total: 110, success: true });
  });

  it("responds 500 when the request has no session at all", async () => {
    const res = buildRes();
    await getCartStatsControl({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("newsletter send controls", () => {
  it("returns exact 400 errors for invalid buttons", async () => {
    const sendRes = buildRes();
    await sendNewsletterControl(buildReq({ body: { html: "Body", buttonText: "View" } }), sendRes);
    expect(sendRes.status).toHaveBeenCalledWith(400);
    expect(sendRes.json).toHaveBeenCalledWith({ error: "Button text and link are both required" });

    const testRes = buildRes();
    await sendTestNewsletterControl(buildReq({ body: { html: "Body", buttonText: "View", buttonUrl: "/local" } }), testRes);
    expect(testRes.status).toHaveBeenCalledWith(400);
    expect(testRes.json).toHaveBeenCalledWith({ error: "Button link must start with http:// or https://" });
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe("getSiteUrlControl", () => {
  it("returns the site URL from env", async () => {
    const res = buildRes();
    await getSiteUrlControl(buildReq(), res);
    expect(res.json).toHaveBeenCalledWith({ siteUrl: "http://localhost:0" });
  });

  it("strips a trailing slash", async () => {
    vi.stubEnv("SITE_URL", "https://example.test/");
    const res = buildRes();
    await getSiteUrlControl(buildReq(), res);
    expect(res.json).toHaveBeenCalledWith({ siteUrl: "https://example.test" });
  });
});

describe("addNewProductControl", () => {
  const productBody = { name: "New Art", price: "20", description: "Description", picData: [{ filename: "art.jpg" }] };

  it("keeps the existing response and sends no mail when notification is absent", async () => {
    const res = buildRes();
    await addNewProductControl(buildReq({ body: productBody }), res);

    const response = res.json.mock.calls[0][0];
    expect(response).not.toHaveProperty("emailSent");
    expect(response).not.toHaveProperty("emailMessage");
    expect(response).not.toHaveProperty("subscriberCount");
    expect(axios.post).not.toHaveBeenCalled();

    const storedProduct = readCollection(PRODUCTS)[0];
    expect(storedProduct).not.toHaveProperty("notifySubscribers");
    expect(storedProduct).not.toHaveProperty("emailButtonText");
    expect(storedProduct).not.toHaveProperty("emailButtonUrl");
  });

  it("announces when notifySubscribers is the string true without storing email fields", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub@example.test" }]);
    const res = buildRes();
    await addNewProductControl(buildReq({ body: { ...productBody, notifySubscribers: "true", emailButtonText: "See It", emailButtonUrl: "https://shop.test/art" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, emailSent: true, subscriberCount: 1 }));
    expect(readCollection(PRODUCTS)[0]).not.toHaveProperty("notifySubscribers");
    expect(readCollection(PRODUCTS)[0]).not.toHaveProperty("emailButtonText");
    expect(readCollection(PRODUCTS)[0]).not.toHaveProperty("emailButtonUrl");
  });

  it("stores the product when announcement sending fails", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub@example.test" }]);
    axios.post.mockRejectedValue(new Error("mail failed"));
    const res = buildRes();
    await addNewProductControl(buildReq({ body: { ...productBody, notifySubscribers: true } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, emailSent: false }));
    expect(readCollection(PRODUCTS)).toHaveLength(1);
  });

  it("reports emailSent true when the mail went out but archiving the copy failed", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub@example.test" }]);
    const originalStoreAny = FakeDbModel.prototype.storeAny;
    const storeSpy = vi.spyOn(FakeDbModel.prototype, "storeAny").mockImplementation(function () {
      if (this.collection === NEWSLETTERS) throw new Error("insert failed");
      return originalStoreAny.call(this);
    });

    const res = buildRes();
    await addNewProductControl(buildReq({ body: { ...productBody, notifySubscribers: true } }), res);
    storeSpy.mockRestore();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, emailSent: true, emailMessage: "Newsletter sent, but archiving a copy failed", subscriberCount: 1 })
    );
    expect(readCollection(PRODUCTS)).toHaveLength(1);
    expect(readCollection(NEWSLETTERS)).toHaveLength(0);
  });

  it("stores the product but rejects an invalid announcement button URL", async () => {
    const res = buildRes();
    await addNewProductControl(buildReq({ body: { ...productBody, notifySubscribers: true, emailButtonUrl: "/local" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, emailSent: false, emailMessage: "Button link must start with http:// or https://" }));
    expect(readCollection(PRODUCTS)).toHaveLength(1);
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe("getCategoriesControl", () => {
  it("returns the category list with product counts", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productType: "acorns" }),
      buildProductDoc({ productId: "p2", productType: "acorns" }),
    ]);
    const res = buildRes();
    await getCategoriesControl(buildReq(), res);
    expect(res.json).toHaveBeenCalledWith([{ key: "acorns", title: "Acorns", letter: "A", productCount: 2 }]);
  });

  it("returns an empty array instead of null when categories fail to load", async () => {
    const getAllSpy = vi.spyOn(FakeDbModel.prototype, "getAll").mockImplementation(function () {
      if (this.collection === CATEGORIES) throw new Error("read failed");
      return [];
    });

    const res = buildRes();
    await getCategoriesControl(buildReq(), res);
    getAllSpy.mockRestore();

    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("addCategoryControl", () => {
  it("adds a new category and returns success", async () => {
    const res = buildRes();
    await addCategoryControl(buildReq({ body: { title: "Gems", letter: "Z" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ key: "gems", title: "Gems", letter: "Z" }),
    }));
    expect(readCollection(CATEGORIES)).toHaveLength(DEFAULT_CATEGORIES.length + 1);
  });

  it("accepts a letter that another category already uses", async () => {
    const res = buildRes();
    await addCategoryControl(buildReq({ body: { title: "Geckos", letter: "G" } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ key: "geckos", letter: "G" }),
    }));
    expect(readCollection(CATEGORIES)).toHaveLength(DEFAULT_CATEGORIES.length + 1);
  });

  it("rejects a missing letter", async () => {
    const res = buildRes();
    await addCategoryControl(buildReq({ body: { title: "Gems" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Letter must be a single letter A-Z" });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await addCategoryControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
    expect(readCollection(CATEGORIES)).toHaveLength(0);
  });
});

describe("updateCategoryLetterControl", () => {
  it("changes the letter and renames that category's product codes when renumber is true", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productType: "acorns", productCode: "A001" }),
      buildProductDoc({ productId: "p2", productType: "other", productCode: "A002" }),
    ]);
    const res = buildRes();
    await updateCategoryLetterControl(buildReq({ body: { key: "acorns", letter: "z", renumber: true } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Letter changed to Z; 1 product code renamed", letter: "Z", renamedCount: 1 });
    expect(readCollection(CATEGORIES)[0].letter).toBe("Z");
    expect(readCollection(PRODUCTS)[0].productCode).toBe("Z001");
    expect(readCollection(PRODUCTS)[1].productCode).toBe("A002");
  });

  it("changes only the letter when renumber is omitted", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productType: "acorns", productCode: "A001" })]);
    const res = buildRes();
    await updateCategoryLetterControl(buildReq({ body: { key: "acorns", letter: "Z" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Letter changed to Z", letter: "Z", renamedCount: 0 });
    expect(readCollection(PRODUCTS)[0].productCode).toBe("A001");
  });

  it("treats the string \"true\" as renumber", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productType: "acorns", productCode: "A001" })]);
    const res = buildRes();
    await updateCategoryLetterControl(buildReq({ body: { key: "acorns", letter: "B", renumber: "true" } }), res);
    expect(readCollection(PRODUCTS)[0].productCode).toBe("B001");
  });

  it("reports category not found for an unknown key", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    const res = buildRes();
    await updateCategoryLetterControl(buildReq({ body: { key: "nope", letter: "B" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Category not found" });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await updateCategoryLetterControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
  });
});

describe("updateCategoryTitleControl", () => {
  it("renames the category and keeps its key", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    const res = buildRes();
    await updateCategoryTitleControl(buildReq({ body: { key: "acorns", title: "Oak Acorns" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Category renamed to "Oak Acorns"', title: "Oak Acorns" });
    expect(readCollection(CATEGORIES)[0].key).toBe("acorns");
    expect(readCollection(CATEGORIES)[0].title).toBe("Oak Acorns");
  });

  it("reports category not found for an unknown key", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    const res = buildRes();
    await updateCategoryTitleControl(buildReq({ body: { key: "nope", title: "Anything" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Category not found" });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await updateCategoryTitleControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
  });
});

describe("deleteCategoryControl", () => {
  it("deletes an existing category", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    const res = buildRes();
    await deleteCategoryControl(buildReq({ body: { key: "acorns" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Category deleted successfully" });
    expect(readCollection(CATEGORIES)).toHaveLength(0);
  });

  it("reports category not found for an unknown key", async () => {
    const res = buildRes();
    await deleteCategoryControl(buildReq({ body: { key: "nope" } }), res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Category not found" });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await deleteCategoryControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
  });
});

describe("nextProductCodeControl", () => {
  it("returns the next sequential product code for a category", async () => {
    seedCollection(CATEGORIES, [{ key: "acorns", title: "Acorns", letter: "A", dateCreated: new Date().toISOString() }]);
    seedCollection(PRODUCTS, [
      buildProductDoc({ productId: "p1", productCode: "A001" }),
      buildProductDoc({ productId: "p2", productCode: "A007" }),
    ]);
    const res = buildRes();
    await nextProductCodeControl(buildReq({ body: { productType: "acorns" } }), res);
    expect(res.json).toHaveBeenCalledWith({ productCode: "A008" });
  });

  it("returns null for an unknown category", async () => {
    const res = buildRes();
    await nextProductCodeControl(buildReq({ body: { productType: "unknown" } }), res);
    expect(res.json).toHaveBeenCalledWith({ productCode: null });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await nextProductCodeControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
  });
});

describe("checkProductCodeControl", () => {
  it("reports an existing owner when the product code is already used", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productCode: "A001", name: "Acorn Necklace" })]);
    const res = buildRes();
    await checkProductCodeControl(buildReq({ body: { productCode: "a001" } }), res);
    expect(res.json).toHaveBeenCalledWith({ exists: true, name: "Acorn Necklace" });
  });

  it("excludes the product being edited via productId", async () => {
    seedCollection(PRODUCTS, [buildProductDoc({ productId: "p1", productCode: "A001", name: "Acorn Necklace" })]);
    const res = buildRes();
    await checkProductCodeControl(buildReq({ body: { productCode: "A001", productId: "p1" } }), res);
    expect(res.json).toHaveBeenCalledWith({ exists: false, name: null });
  });

  it("reports no match for a blank product code", async () => {
    const res = buildRes();
    await checkProductCodeControl(buildReq({ body: { productCode: "" } }), res);
    expect(res.json).toHaveBeenCalledWith({ exists: false, name: null });
  });

  it("responds 500 when no input parameters are provided", async () => {
    const res = buildRes();
    await checkProductCodeControl({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "No input parameters" });
  });
});
