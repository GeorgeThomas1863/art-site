import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authController } from "../controllers/auth-controller.js";
import requireAuth from "../middleware/auth-config.js";
import { authRateLimit, recordFailedAttempt, clearAttempts } from "../middleware/auth-rate-limit.js";

process.env.ADMIN_PW = "correct-password";

// The rate limiter keeps state in a module-level Map, so each test uses its own IP.
let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;

const buildRes = () => ({
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
  setHeader: vi.fn(),
  sendFile: vi.fn(),
});

describe("authController", () => {
  it("rejects a missing password", () => {
    const res = buildRes();
    const req = { body: {}, ip: nextIp(), session: {} };

    authController(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, redirect: "/401" });
    expect(req.session.authenticated).toBeUndefined();
  });

  it("rejects a wrong password", () => {
    const res = buildRes();
    const req = { body: { pw: "wrong" }, ip: nextIp(), session: {} };

    authController(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, redirect: "/401" });
    expect(req.session.authenticated).toBeUndefined();
  });

  it("authenticates the session on the correct password", () => {
    const res = buildRes();
    const req = { body: { pw: "correct-password" }, ip: nextIp(), session: {} };

    authController(req, res);

    expect(req.session.authenticated).toBe(true);
    expect(res.json).toHaveBeenCalledWith({ success: true, redirect: "/admin" });
  });
});

describe("authRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests from a fresh IP", () => {
    const res = buildRes();
    const next = vi.fn();

    authRateLimit({ ip: nextIp() }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("blocks an IP after 10 failed attempts", () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      recordFailedAttempt(ip);
    }
    const res = buildRes();
    const next = vi.fn();

    authRateLimit({ ip }, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  it("does not block other IPs", () => {
    const blockedIp = nextIp();
    for (let i = 0; i < 10; i++) {
      recordFailedAttempt(blockedIp);
    }
    const res = buildRes();
    const next = vi.fn();

    authRateLimit({ ip: nextIp() }, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("unblocks an IP after the 15-minute window expires", () => {
    vi.useFakeTimers();
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      recordFailedAttempt(ip);
    }

    vi.advanceTimersByTime(16 * 60 * 1000);
    const res = buildRes();
    const next = vi.fn();
    authRateLimit({ ip }, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("a successful login clears the failure count", () => {
    const ip = nextIp();
    for (let i = 0; i < 9; i++) {
      recordFailedAttempt(ip);
    }
    const req = { body: { pw: "correct-password" }, ip, session: {} };
    authController(req, buildRes());

    recordFailedAttempt(ip); // one new failure should not block
    const res = buildRes();
    const next = vi.fn();
    authRateLimit({ ip }, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("requireAuth", () => {
  it("passes authenticated sessions through with no-store caching", () => {
    const res = buildRes();
    const next = vi.fn();

    requireAuth({ session: { authenticated: true } }, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(next).toHaveBeenCalled();
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it("serves the login page to unauthenticated sessions", () => {
    const res = buildRes();
    const next = vi.fn();

    requireAuth({ session: {} }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendFile).toHaveBeenCalledTimes(1);
    expect(res.sendFile.mock.calls[0][0]).toContain("auth.html");
  });
});
