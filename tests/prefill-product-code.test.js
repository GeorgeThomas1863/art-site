import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../public/js/util/api-front.js", () => ({ sendToBack: vi.fn() }));
vi.mock("../public/js/util/popup.js", () => ({
  displayPopup: vi.fn(),
  displayConfirmDialog: vi.fn(),
}));
vi.mock("../public/js/forms/admin-form.js", () => ({ buildLetterInput: vi.fn() }));

import { prefillNextProductCode } from "../public/js/helpers/admin-categories.js";
import { sendToBack } from "../public/js/util/api-front.js";

// Minimal DOM: the edit-mode code input and type select prefillNextProductCode reads
const buildPrefillDom = () => {
  const codeInput = { value: "" };
  const typeSelect = { value: "gems" };

  global.document = {
    getElementById: (id) => {
      if (id === "edit-product-code") return codeInput;
      if (id === "edit-product-type") return typeSelect;
      return null;
    },
  };

  return codeInput;
};

afterEach(() => {
  vi.clearAllMocks();
  delete global.document;
});

describe("prefillNextProductCode in-flight typing race", () => {
  test("writes the suggestion when the field stays blank during the fetch", async () => {
    const codeInput = buildPrefillDom();
    sendToBack.mockResolvedValue({ productCode: "G001" });

    const result = await prefillNextProductCode("edit");

    expect(result).toBe("G001");
    expect(codeInput.value).toBe("G001");
  });

  test("does not clobber a code the admin typed while the request was in flight", async () => {
    const codeInput = buildPrefillDom();
    let releaseFetch;
    sendToBack.mockReturnValue(new Promise((resolve) => { releaseFetch = resolve; }));

    const pending = prefillNextProductCode("edit");
    codeInput.value = "MY-77"; // admin types before the backend responds
    releaseFetch({ productCode: "G002" });
    const result = await pending;

    expect(result).toBeNull();
    expect(codeInput.value).toBe("MY-77");
  });

  test("discards a stale response when a newer prefill is already in flight", async () => {
    const codeInput = buildPrefillDom();
    let releaseFirst;
    let releaseSecond;
    sendToBack
      .mockReturnValueOnce(new Promise((resolve) => { releaseFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { releaseSecond = resolve; }));

    const firstPending = prefillNextProductCode("edit"); // category A selected
    const secondPending = prefillNextProductCode("edit"); // admin switches to category B before A answers

    releaseFirst({ productCode: "A013" }); // stale category-A response lands while the field is still blank
    const firstResult = await firstPending;
    releaseSecond({ productCode: "B007" });
    const secondResult = await secondPending;

    expect(firstResult).toBeNull();
    expect(secondResult).toBe("B007");
    expect(codeInput.value).toBe("B007");
  });
});
