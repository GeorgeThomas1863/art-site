import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeMongoValue,
  sanitizeFilename,
  validateEmail,
  validateZip,
  validatePositiveInt,
  validatePositiveNumber,
  validateString,
  sanitizeEmailHeader,
  whitelistFields,
} from "../src/sanitize.js";

describe("escapeHtml", () => {
  it("escapes all HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x&'y")</script>`)).toBe("&lt;script&gt;alert(&quot;x&amp;&#x27;y&quot;)&lt;/script&gt;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Blue Painting 16x20")).toBe("Blue Painting 16x20");
  });

  it("returns empty string for non-string input", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("");
    expect(escapeHtml({ a: 1 })).toBe("");
  });
});

describe("sanitizeMongoValue", () => {
  it("passes through primitive values", () => {
    expect(sanitizeMongoValue("p1")).toBe("p1");
    expect(sanitizeMongoValue(7)).toBe(7);
  });

  it("passes through null and undefined", () => {
    expect(sanitizeMongoValue(null)).toBe(null);
    expect(sanitizeMongoValue(undefined)).toBe(undefined);
  });

  it("converts objects with $-prefixed keys to strings (NoSQL operator injection)", () => {
    const injected = { $gt: "" };
    const result = sanitizeMongoValue(injected);
    expect(typeof result).toBe("string");
  });

  it("passes through objects without $-prefixed keys", () => {
    const plain = { productId: "p1" };
    expect(sanitizeMongoValue(plain)).toBe(plain);
  });
});

describe("sanitizeFilename", () => {
  it("strips path traversal and returns basename", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
  });

  it("handles Windows-style separators", () => {
    expect(sanitizeFilename("..\\..\\windows\\evil.exe")).toBe("evil.exe");
  });

  it("removes null bytes", () => {
    expect(sanitizeFilename("photo\0.png")).toBe("photo.png");
  });

  it("leaves a plain filename unchanged", () => {
    expect(sanitizeFilename("painting-01.jpg")).toBe("painting-01.jpg");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeFilename(null)).toBe("");
    expect(sanitizeFilename(42)).toBe("");
  });
});

describe("validateEmail", () => {
  it("accepts a normal email", () => {
    expect(validateEmail("buyer@example.com")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("a b@example.com")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
  });

  it("rejects header injection attempts with newlines", () => {
    expect(validateEmail("buyer@example.com\r\nBcc: victim@example.com")).toBe(false);
    expect(validateEmail("buyer@example.com\n")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(42)).toBe(false);
  });
});

describe("validateZip", () => {
  it("accepts 5-digit and ZIP+4 formats", () => {
    expect(validateZip("30301")).toBe(true);
    expect(validateZip("30301-1234")).toBe(true);
  });

  it("rejects wrong lengths and non-digits", () => {
    expect(validateZip("3030")).toBe(false);
    expect(validateZip("303011")).toBe(false);
    expect(validateZip("abcde")).toBe(false);
    expect(validateZip("30301-12")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(validateZip(30301)).toBe(false);
    expect(validateZip(null)).toBe(false);
  });
});

describe("validatePositiveInt", () => {
  it("parses positive integers from numbers and strings", () => {
    expect(validatePositiveInt(3)).toBe(3);
    expect(validatePositiveInt("7")).toBe(7);
  });

  it("rejects zero, negatives, and non-numeric input", () => {
    expect(validatePositiveInt(0)).toBe(null);
    expect(validatePositiveInt(-2)).toBe(null);
    expect(validatePositiveInt("abc")).toBe(null);
    expect(validatePositiveInt(null)).toBe(null);
  });

  it("truncates decimals via parseInt (current behavior)", () => {
    expect(validatePositiveInt("2.9")).toBe(2);
    expect(validatePositiveInt(2.9)).toBe(2);
  });
});

describe("validatePositiveNumber", () => {
  it("parses positive floats", () => {
    expect(validatePositiveNumber("2.5")).toBe(2.5);
    expect(validatePositiveNumber(0.1)).toBe(0.1);
  });

  it("rejects zero, negatives, and non-numeric input", () => {
    expect(validatePositiveNumber(0)).toBe(null);
    expect(validatePositiveNumber(-1.5)).toBe(null);
    expect(validatePositiveNumber("abc")).toBe(null);
  });
});

describe("validateString", () => {
  it("passes normal strings through", () => {
    expect(validateString("hello world")).toBe("hello world");
  });

  it("strips control characters but keeps newline and tab", () => {
    expect(validateString("a\x00b\x1Fc\nd\te")).toBe("abc\nd\te");
  });

  it("caps length at maxLength", () => {
    expect(validateString("abcdefghij", 5)).toBe("abcde");
  });

  it("returns null for non-string input", () => {
    expect(validateString(42)).toBe(null);
    expect(validateString(null)).toBe(null);
  });
});

describe("sanitizeEmailHeader", () => {
  it("strips CR, LF, and tab characters", () => {
    expect(sanitizeEmailHeader("Order\r\nBcc: evil@x.com\tdone")).toBe("OrderBcc: evil@x.comdone");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeEmailHeader(null)).toBe("");
    expect(sanitizeEmailHeader(42)).toBe("");
  });
});

describe("whitelistFields", () => {
  it("keeps only allowed fields (mass assignment protection)", () => {
    const input = { name: "Painting", price: 100, isAdmin: true, $set: { hacked: 1 } };
    expect(whitelistFields(input, ["name", "price"])).toEqual({ name: "Painting", price: 100 });
  });

  it("omits allowed fields missing from the input", () => {
    expect(whitelistFields({ name: "Painting" }, ["name", "price"])).toEqual({ name: "Painting" });
  });

  it("returns empty object for null or non-object input", () => {
    expect(whitelistFields(null, ["name"])).toEqual({});
    expect(whitelistFields("string", ["name"])).toEqual({});
  });
});
