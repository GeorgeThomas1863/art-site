// Admin login is a single shared password gated by an in-memory per-IP rate limit.
// These tests pin lockout after 10 failures, reset on success, and expiry after 15 minutes.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authController } from "../controllers/auth-controller.js";
import { authRateLimit, recordFailedAttempt, clearAttempts } from "../middleware/auth-rate-limit.js";
import requireAuth from "../middleware/auth-config.js";
import { buildSessionConfig } from "../middleware/session-config.js";
import { buildReq } from "./helpers/mock-req.js";

const buildRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

const IP = "203.0.113.7";

beforeEach(() => {
  clearAttempts(IP);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("authController", () => {
  it("authenticates the session on the correct password", () => {
    const req = buildReq({ body: { pw: process.env.ADMIN_PW }, ip: IP });
    const res = buildRes();

    authController(req, res);

    expect(res.body).toEqual({ success: true, redirect: "/admin" });
    expect(req.session.authenticated).toBe(true);
  });

  it("rejects a wrong password and does not touch the session", () => {
    const req = buildReq({ body: { pw: "wrong" }, ip: IP });
    const res = buildRes();

    authController(req, res);

    expect(res.body).toEqual({ success: false, redirect: "/401" });
    expect(req.session.authenticated).toBeUndefined();
  });

  it("rejects a missing password", () => {
    const req = buildReq({ body: {}, ip: IP });
    const res = buildRes();

    authController(req, res);

    expect(res.body).toEqual({ success: false, redirect: "/401" });
  });

  it("does not accept an object as the password (no loose equality tricks)", () => {
    const req = buildReq({ body: { pw: { $ne: "" } }, ip: IP });
    const res = buildRes();

    authController(req, res);

    expect(res.body.success).toBe(false);
  });
});

describe("authRateLimit", () => {
  const runMiddleware = (ip) => {
    const res = buildRes();
    const next = vi.fn();
    authRateLimit(buildReq({ ip }), res, next);
    return { res, next };
  };

  it("lets requests through below the limit", () => {
    for (let i = 0; i < 9; i++) recordFailedAttempt(IP);
    const { next, res } = runMiddleware(IP);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("blocks with 429 after 10 failed attempts", () => {
    for (let i = 0; i < 10; i++) recordFailedAttempt(IP);
    const { next, res } = runMiddleware(IP);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
  });

  it("locks out only the offending IP", () => {
    for (let i = 0; i < 10; i++) recordFailedAttempt(IP);
    const { next } = runMiddleware("198.51.100.1");
    expect(next).toHaveBeenCalled();
  });

  it("resets the counter after a successful login", () => {
    for (let i = 0; i < 9; i++) recordFailedAttempt(IP);
    authController(buildReq({ body: { pw: process.env.ADMIN_PW }, ip: IP }), buildRes());

    // 9 more failures: 9 total if reset, 18 if not
    for (let i = 0; i < 9; i++) recordFailedAttempt(IP);
    expect(runMiddleware(IP).next).toHaveBeenCalled();
  });

  it("counts a failed login attempt against the IP", () => {
    for (let i = 0; i < 9; i++) recordFailedAttempt(IP);
    authController(buildReq({ body: { pw: "wrong" }, ip: IP }), buildRes());
    expect(runMiddleware(IP).res.statusCode).toBe(429);
  });

  it("forgets failures once the 15-minute window has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T10:00:00Z"));
    for (let i = 0; i < 10; i++) recordFailedAttempt(IP);
    expect(runMiddleware(IP).res.statusCode).toBe(429);

    vi.setSystemTime(new Date("2026-08-15T10:15:01Z"));
    expect(runMiddleware(IP).next).toHaveBeenCalled();
  });

  it("starts a fresh window when a failure arrives after the old window expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T10:00:00Z"));
    for (let i = 0; i < 10; i++) recordFailedAttempt(IP);

    vi.setSystemTime(new Date("2026-08-15T10:20:00Z"));
    recordFailedAttempt(IP);
    expect(runMiddleware(IP).next).toHaveBeenCalled();
  });
});

describe("requireAuth", () => {
  const buildGateRes = () => {
    return { setHeader: vi.fn(), sendFile: vi.fn() };
  };

  it("calls next() and never serves the auth page when the session is authenticated", () => {
    const res = buildGateRes();
    const next = vi.fn();
    requireAuth(buildReq({ session: { authenticated: true } }), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it("serves auth.html instead of calling next() when the session is not authenticated", () => {
    const res = buildGateRes();
    const next = vi.fn();
    requireAuth(buildReq({ session: {} }), res, next);
    expect(res.sendFile).toHaveBeenCalledOnce();
    expect(res.sendFile.mock.calls[0][0]).toMatch(/auth\.html$/);
    expect(next).not.toHaveBeenCalled();
  });

  it("marks the response no-store so the gate result is never cached", () => {
    const res = buildGateRes();
    requireAuth(buildReq({ session: {} }), res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });
});

describe("buildSessionConfig", () => {
  afterEach(() => {
    delete process.env.COOKIE_SECURE;
  });

  it("leaves the session cookie non-secure when COOKIE_SECURE is unset", () => {
    delete process.env.COOKIE_SECURE;
    expect(buildSessionConfig().cookie.secure).toBe(false);
  });

  it("marks the session cookie secure only when COOKIE_SECURE is the string true", () => {
    process.env.COOKIE_SECURE = "true";
    expect(buildSessionConfig().cookie.secure).toBe(true);
    process.env.COOKIE_SECURE = "false";
    expect(buildSessionConfig().cookie.secure).toBe(false);
  });
});
