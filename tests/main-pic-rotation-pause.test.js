import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// getProductRotationEntries hits the network via sendToBack; stub it to fail so
// startMainPicRotation falls back to the static mainPicArray — keeps this file
// focused on timer/pause behavior, independent of product-data shape.
vi.mock("../public/js/util/api-front.js", () => ({
  sendToBack: vi.fn().mockResolvedValue(null),
}));

import { startMainPicRotation, rotateMainPic } from "../public/js/helpers/rotate-pics.js";

const MAIN_ROTATION_INTERVAL = 10000;
const MANUAL_INTERACTION_PAUSE = 30000;
// setMainRotationEntry's non-instant (auto) path fades via a crossfade layer before the visible
// backgroundImage updates — every *auto* advance (never a manual/instant one) lands this much
// after its scheduled timer fires. Mirrors CROSSFADE_DURATION in rotate-pics.js.
const CROSSFADE_DURATION = 1600;

describe("homepage manual-interaction pause", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("pauses auto-rotation for 30 seconds after a manual interaction (arrow/drag/swipe all call rotateMainPic)", async () => {
    const { leftPanel } = await setupHomepagePanels();

    const beforeManual = leftPanel.style.backgroundImage;
    await rotateMainPic(leftPanel, "next", true); // manual nav — instant, as today
    const afterManual = leftPanel.style.backgroundImage;
    expect(afterManual).not.toBe(beforeManual);

    await vi.advanceTimersByTimeAsync(MANUAL_INTERACTION_PAUSE + CROSSFADE_DURATION - 1);
    expect(leftPanel.style.backgroundImage).toBe(afterManual); // still paused, no auto-advance visible yet

    await vi.advanceTimersByTimeAsync(1); // 30s pause elapsed + the auto-advance's own crossfade completed
    expect(leftPanel.style.backgroundImage).not.toBe(afterManual); // auto-rotation resumed
  });

  it("resets the 30-second pause on every manual interaction (t=0 then t=20s -> resumes at t=50s)", async () => {
    const { leftPanel } = await setupHomepagePanels();

    await rotateMainPic(leftPanel, "next", true); // t = 0
    const afterFirst = leftPanel.style.backgroundImage;

    await vi.advanceTimersByTimeAsync(20000); // t = 20s, still inside the first pause window
    expect(leftPanel.style.backgroundImage).toBe(afterFirst);

    await rotateMainPic(leftPanel, "next", true); // second manual interaction resets the timer
    const afterSecond = leftPanel.style.backgroundImage;
    expect(afterSecond).not.toBe(afterFirst);

    await vi.advanceTimersByTimeAsync(MANUAL_INTERACTION_PAUSE + CROSSFADE_DURATION - 1); // just short of 30s + crossfade since the 2nd interaction
    expect(leftPanel.style.backgroundImage).toBe(afterSecond); // still paused

    await vi.advanceTimersByTimeAsync(1); // 30s since the 2nd interaction, plus its auto-advance's crossfade
    expect(leftPanel.style.backgroundImage).not.toBe(afterSecond); // auto-rotation resumed on schedule
  });

  it("resumes auto-rotation on the normal ~10-second interval, not the 30-second pause length", async () => {
    const { leftPanel } = await setupHomepagePanels();

    await rotateMainPic(leftPanel, "next", true);
    await vi.advanceTimersByTimeAsync(MANUAL_INTERACTION_PAUSE + CROSSFADE_DURATION); // pause elapses, one auto-advance completes
    const afterResume = leftPanel.style.backgroundImage;

    await vi.advanceTimersByTimeAsync(MAIN_ROTATION_INTERVAL + CROSSFADE_DURATION - 1);
    expect(leftPanel.style.backgroundImage).toBe(afterResume); // one normal interval hasn't fully elapsed yet

    // If auto-rotation were still gated by the 30s pause, this wouldn't have changed for
    // another ~19s. Changing here proves it's back on the normal ~10s interval.
    await vi.advanceTimersByTimeAsync(1);
    expect(leftPanel.style.backgroundImage).not.toBe(afterResume);
  });

  it("keeps manual navigation instant — no crossfade wait — while the pause is scheduled", async () => {
    const { leftPanel } = await setupHomepagePanels();

    const before = leftPanel.style.backgroundImage;
    const rotatePromise = rotateMainPic(leftPanel, "next", true);
    // Instant path resolves without needing to advance fake timers for a crossfade.
    await rotatePromise;
    expect(leftPanel.style.backgroundImage).not.toBe(before);
  });
});

// Builds the two homepage split-image panels and stubs the DOM/Image globals just enough for
// startMainPicRotation to run end-to-end (crossfade layer init + initial non-instant picture set).
const setupHomepagePanels = async () => {
  const leftPanel = buildPanelElement();
  const rightPanel = buildPanelElement();

  vi.stubGlobal("document", {
    getElementById: (id) => {
      if (id === "split-image-left") return leftPanel;
      if (id === "split-image-right") return rightPanel;
      return null;
    },
    createElement: () => ({ classList: { add: vi.fn(), toggle: vi.fn() }, style: {} }),
  });
  vi.stubGlobal("requestAnimationFrame", (callback) => callback());
  vi.stubGlobal("Image", class {
    set src(value) {
      this.naturalWidth = 400;
      this.naturalHeight = 400;
      this.onload();
    }
  });

  const startPromise = startMainPicRotation();
  await vi.advanceTimersByTimeAsync(1600); // let the initial (non-instant) crossfade settle on both panels
  await startPromise;

  return { leftPanel, rightPanel };
};

const buildPanelElement = () => {
  let layer = null;
  return {
    style: {},
    dataset: {},
    href: "/products",
    classList: { toggle: vi.fn() },
    appendChild: (child) => { layer = child; },
    querySelector: (selector) => (selector === ".image-crossfade-layer" ? layer : null),
  };
};
