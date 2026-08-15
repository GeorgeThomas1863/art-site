// Controller-level status mapping: /api/square-config must fail loud when sandbox lacks its
// IDs (the sandbox SDK rejects prod fallbacks), and /newsletter/add must map validation and
// store failures to the right status codes.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

import axios from "axios";
import { getSquareConfigControl, addSubscriberControl, getCartStatsControl } from "../controllers/data-controller.js";
import { buildReq } from "./helpers/mock-req.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";

const SUBSCRIBERS = process.env.SUBSCRIBERS_COLLECTION;

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
