// src/mailer.js talks to Mailgun over raw HTTP. These tests pin the URL, auth, and form encoding
// so a refactor cannot silently send to the wrong domain, drop bcc recipients, or lose Reply-To.

import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

import axios from "axios";
import { sendMail } from "../src/mailer.js";

const okResponse = { status: 200, data: { id: "<msg-1@mg.example.test>" } };

const lastPostCall = () => {
  const [url, params, config] = axios.post.mock.calls[axios.post.mock.calls.length - 1];
  return { url, params, config };
};

describe("sendMail", () => {
  it("posts to {MAILGUN_BASE_URL}/v3/{MAILGUN_DOMAIN}/messages with api-key basic auth", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "shop@example.test", to: "jane@example.test", subject: "Hi", text: "Hello" });

    const { url, config } = lastPostCall();
    expect(url).toBe("https://api.mailgun.test/v3/mg.example.test/messages");
    expect(config.auth).toEqual({ username: "api", password: "fake-mailgun-key" });
  });

  it("encodes from/to/subject/html/text as form fields", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "shop@example.test", to: "jane@example.test", subject: "Order", html: "<b>hi</b>", text: "hi" });

    const { params } = lastPostCall();
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.get("from")).toBe("shop@example.test");
    expect(params.get("to")).toBe("jane@example.test");
    expect(params.get("subject")).toBe("Order");
    expect(params.get("html")).toBe("<b>hi</b>");
    expect(params.get("text")).toBe("hi");
  });

  it("appends every bcc address separately when given an array", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "a@x.test", subject: "News", html: "x", bcc: ["b@x.test", "c@x.test", "d@x.test"] });

    const { params } = lastPostCall();
    expect(params.getAll("bcc")).toEqual(["b@x.test", "c@x.test", "d@x.test"]);
    expect(params.has("to")).toBe(false);
  });

  it("accepts a single bcc string", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "a@x.test", subject: "News", html: "x", bcc: "b@x.test" });

    expect(lastPostCall().params.getAll("bcc")).toEqual(["b@x.test"]);
  });

  it("sets Reply-To via Mailgun's h:Reply-To header field", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "shop@example.test", to: "admin@example.test", subject: "Contact", text: "x", replyTo: "visitor@example.test" });

    expect(lastPostCall().params.get("h:Reply-To")).toBe("visitor@example.test");
  });

  it("omits optional fields that were not provided", async () => {
    axios.post.mockResolvedValue(okResponse);

    await sendMail({ from: "a@x.test", to: "b@x.test", subject: "S", text: "t" });

    const { params } = lastPostCall();
    expect(params.has("html")).toBe(false);
    expect(params.has("bcc")).toBe(false);
    expect(params.has("h:Reply-To")).toBe(false);
  });

  it("returns the Mailgun message id", async () => {
    axios.post.mockResolvedValue(okResponse);

    const result = await sendMail({ from: "a@x.test", to: "b@x.test", subject: "S", text: "t" });

    expect(result).toEqual({ messageId: "<msg-1@mg.example.test>" });
  });

  it("propagates HTTP failures to the caller", async () => {
    axios.post.mockRejectedValue(new Error("401 Unauthorized"));

    await expect(sendMail({ from: "a@x.test", to: "b@x.test", subject: "S", text: "t" })).rejects.toThrow("401");
  });

  describe("MAIL_MODE", () => {
    afterEach(() => {
      delete process.env.MAIL_MODE;
    });

    it("skips axios and returns a log-mode id when MAIL_MODE=log", async () => {
      process.env.MAIL_MODE = "log";

      const result = await sendMail({ from: "a@x.test", to: "b@x.test", subject: "S", text: "t" });

      expect(axios.post).not.toHaveBeenCalled();
      expect(result).toEqual({ messageId: "log-mode" });
    });

    it("still calls axios when MAIL_MODE is unset", async () => {
      axios.post.mockResolvedValue(okResponse);

      await sendMail({ from: "a@x.test", to: "b@x.test", subject: "S", text: "t" });

      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
