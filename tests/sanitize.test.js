// src/sanitize.js is the input-hardening layer for email, Mongo, and file uploads.
// Each block below targets one attack the function exists to stop.

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
  it("neutralises a script tag injected into an email body", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  it("escapes ampersand and single quote", () => {
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#x27;s");
  });

  it("returns empty string for non-strings", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(42)).toBe("");
    expect(escapeHtml({ toString: () => "<b>" })).toBe("");
  });
});

describe("sanitizeMongoValue", () => {
  it("stringifies an object carrying a $-operator so it cannot become a query operator", () => {
    const result = sanitizeMongoValue({ $ne: null });
    expect(typeof result).toBe("string");
  });

  it("passes plain strings and numbers through untouched", () => {
    expect(sanitizeMongoValue("prod-1")).toBe("prod-1");
    expect(sanitizeMongoValue(7)).toBe(7);
  });

  it("passes null and undefined through", () => {
    expect(sanitizeMongoValue(null)).toBeNull();
    expect(sanitizeMongoValue(undefined)).toBeUndefined();
  });

  it("leaves arrays alone (arrays are not operator objects)", () => {
    const arr = ["a", "b"];
    expect(sanitizeMongoValue(arr)).toBe(arr);
  });
});

describe("sanitizeFilename", () => {
  it("strips path traversal and directory components", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\windows\\system32\\cmd.exe")).toBe("cmd.exe");
  });

  it("strips null bytes", () => {
    expect(sanitizeFilename("photo.jpg\0.exe")).toBe("photo.jpg.exe");
  });

  it("returns empty string for non-strings", () => {
    expect(sanitizeFilename(undefined)).toBe("");
  });
});

describe("validateEmail", () => {
  it("accepts a normal address", () => {
    expect(validateEmail("jane.doe@example.com")).toBe(true);
  });

  it("rejects header-injection attempts containing CR/LF", () => {
    expect(validateEmail("jane@example.com\r\nBcc: victim@example.com")).toBe(false);
    expect(validateEmail("jane@example.com\nX: y")).toBe(false);
  });

  it("rejects malformed addresses and non-strings", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
    expect(validateEmail("a b@c.com")).toBe(false);
    expect(validateEmail(null)).toBe(false);
  });
});

describe("validateZip", () => {
  it("accepts 5-digit and ZIP+4 forms", () => {
    expect(validateZip("20500")).toBe(true);
    expect(validateZip("20500-0003")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(validateZip("2050")).toBe(false);
    expect(validateZip("205000")).toBe(false);
    expect(validateZip("20500-12")).toBe(false);
    expect(validateZip(20500)).toBe(false);
    expect(validateZip("ABCDE")).toBe(false);
  });
});

describe("validatePositiveInt", () => {
  it("returns the parsed integer for positive values", () => {
    expect(validatePositiveInt("3")).toBe(3);
    expect(validatePositiveInt(3)).toBe(3);
  });

  it("truncates decimals rather than rejecting them", () => {
    expect(validatePositiveInt("2.9")).toBe(2);
  });

  it("returns null for zero, negatives, and garbage", () => {
    expect(validatePositiveInt("0")).toBeNull();
    expect(validatePositiveInt("-1")).toBeNull();
    expect(validatePositiveInt("abc")).toBeNull();
    expect(validatePositiveInt(undefined)).toBeNull();
  });
});

describe("validatePositiveNumber", () => {
  it("returns the parsed float for positive values", () => {
    expect(validatePositiveNumber("2.5")).toBe(2.5);
  });

  it("returns null for zero, negatives, and garbage", () => {
    expect(validatePositiveNumber("0")).toBeNull();
    expect(validatePositiveNumber("-0.1")).toBeNull();
    expect(validatePositiveNumber("x")).toBeNull();
  });
});

describe("validateString", () => {
  it("strips control characters but keeps newline and tab", () => {
    expect(validateString("a\x00b\x07c\nd\te\x7f")).toBe("abc\nd\te");
  });

  it("caps length at maxLength", () => {
    expect(validateString("abcdef", 3)).toBe("abc");
  });

  it("returns null for non-strings", () => {
    expect(validateString(123)).toBeNull();
  });
});

describe("sanitizeEmailHeader", () => {
  it("removes CR, LF, and tab so a name cannot inject headers into a subject line", () => {
    expect(sanitizeEmailHeader("Jane\r\nBcc: x@y.z\tDoe")).toBe("JaneBcc: x@y.zDoe");
  });

  it("returns empty string for non-strings", () => {
    expect(sanitizeEmailHeader(undefined)).toBe("");
  });
});

describe("whitelistFields", () => {
  it("keeps only allowed keys (mass-assignment guard)", () => {
    const input = { name: "Acorn", price: 25, isAdmin: true, __proto__x: 1 };
    expect(whitelistFields(input, ["name", "price"])).toEqual({ name: "Acorn", price: 25 });
  });

  it("returns empty object for non-objects", () => {
    expect(whitelistFields(null, ["a"])).toEqual({});
    expect(whitelistFields("str", ["a"])).toEqual({});
  });
});
