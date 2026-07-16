import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import debounce from "../public/js/util/debounce.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("runs only the last of a rapid burst of calls, after 500ms", async () => {
    const fn = vi.fn(async (x) => x * 2);
    const debounced = debounce(fn);

    debounced(1);
    debounced(2);
    const lastCall = debounced(3);

    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);

    await expect(lastCall).resolves.toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("runs each call when they are spaced beyond the delay", async () => {
    const fn = vi.fn(async (x) => x);
    const debounced = debounce(fn);

    const first = debounced(1);
    await vi.advanceTimersByTimeAsync(500);
    const second = debounced(2);
    await vi.advanceTimersByTimeAsync(500);

    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rejects when the wrapped function throws", async () => {
    const fn = vi.fn(async () => {
      throw new Error("boom");
    });
    const debounced = debounce(fn);

    const call = debounced();
    call.catch(() => {}); // attach handler before advancing so the rejection is not unhandled
    await vi.advanceTimersByTimeAsync(500);

    await expect(call).rejects.toThrow("boom");
  });

  // Known limitation, documented on purpose: promises from superseded calls never
  // settle (their timers are cleared but nothing resolves/rejects them). Callers
  // that await every invocation will leak pending awaits on all but the last.
});
