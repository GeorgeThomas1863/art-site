import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendToBack, sendToBackFile } from "../public/js/util/api-front.js";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const okResponse = (data) => ({ ok: true, json: async () => data });

describe("sendToBack", () => {
  it("POSTs the params as JSON to the route", async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true, cart: [] }));

    const result = await sendToBack({ route: "/cart/add", data: { productId: "p1", quantity: 1 } });

    expect(result).toEqual({ success: true, cart: [] });
    const [route, params] = fetchMock.mock.calls[0];
    expect(route).toBe("/cart/add");
    expect(params.method).toBe("POST");
    expect(params.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(params.body).data.productId).toBe("p1");
  });

  it("omits the body on GET requests", async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true }));

    await sendToBack({ route: "/cart/stats" }, "GET");

    const [, params] = fetchMock.mock.calls[0];
    expect(params.method).toBe("GET");
    expect(params.body).toBeUndefined();
  });

  it("returns null on a non-OK response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    expect(await sendToBack({ route: "/cart/add" })).toBe(null);
  });

  // Note the asymmetry: HTTP errors → null, network errors → "FAIL".
  // Callers that check `!res || !res.success` handle both, since "FAIL" has no .success.
  it("returns 'FAIL' when the network request throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    expect(await sendToBack({ route: "/cart/add" })).toBe("FAIL");
  });
});

describe("sendToBackFile", () => {
  it("POSTs the FormData without a JSON content type", async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true, fileName: "pic.jpg" }));
    const formData = new FormData();

    const result = await sendToBackFile({ route: "/upload-product-pic-route", formData });

    expect(result).toEqual({ success: true, fileName: "pic.jpg" });
    const [route, params] = fetchMock.mock.calls[0];
    expect(route).toBe("/upload-product-pic-route");
    expect(params.body).toBe(formData);
    expect(params.headers).toBeUndefined();
  });

  it("returns 'FAIL' on non-OK responses and network errors", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 413, json: async () => ({}) });
    expect(await sendToBackFile({ route: "/upload-product-pic-route", formData: new FormData() })).toBe("FAIL");

    fetchMock.mockRejectedValue(new TypeError("network down"));
    expect(await sendToBackFile({ route: "/upload-product-pic-route", formData: new FormData() })).toBe("FAIL");
  });
});
