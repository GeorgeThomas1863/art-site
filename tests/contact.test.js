// src/contact.js validates the contact form, emails the admins via Mailgun, opts the sender into
// the newsletter when requested, and stores the submission — a mail failure must fail the request,
// not just log it silently.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

import axios from "axios";
import { submitContact } from "../src/contact.js";
import { seedCollection, readCollection } from "./helpers/fake-db.js";

const CONTACTS = process.env.CONTACTS_COLLECTION;
const SUBSCRIBERS = process.env.SUBSCRIBERS_COLLECTION;

const okResponse = { status: 200, data: { id: "<msg-1@mg.example.test>" } };

const buildContactInput = (overrides = {}) => {
  return {
    name: "Jane Doe",
    email: "jane@example.test",
    subject: "Hello",
    message: "Hi there",
    ...overrides,
  };
};

beforeEach(() => {
  axios.post.mockResolvedValue(okResponse);
});

describe("submitContact — input validation", () => {
  it("rejects when no input parameters are given", async () => {
    for (const bad of [null, undefined]) {
      const result = await submitContact(bad);
      expect(result).toEqual({ success: false, message: "No input parameters" });
    }
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("rejects missing or malformed email addresses", async () => {
    const badEmails = [undefined, "", "not-an-email", "no-domain@", "@no-local.test", "bad\nnewline@example.test", 12345];
    for (const email of badEmails) {
      const result = await submitContact(buildContactInput({ email }));
      expect(result).toEqual({ success: false, message: "Invalid email address" });
    }
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe("submitContact — successful submission", () => {
  it("sends mail and stores the submission in the contacts collection", async () => {
    const result = await submitContact(buildContactInput());

    expect(result).toEqual({ success: true, message: "Email sent successfully", messageId: "<msg-1@mg.example.test>" });
    const stored = readCollection(CONTACTS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ from: process.env.EMAIL_USER, messageId: "<msg-1@mg.example.test>" });
  });

  it("sends to both configured recipient addresses", async () => {
    await submitContact(buildContactInput());
    const params = axios.post.mock.calls[0][1];
    expect(params.get("to")).toBe("admin1@example.test, admin2@example.test");
  });

  it("sets Reply-To to the submitter's email", async () => {
    await submitContact(buildContactInput({ email: "visitor@example.test" }));
    const params = axios.post.mock.calls[0][1];
    expect(params.get("h:Reply-To")).toBe("visitor@example.test");
  });

  it("builds the subject line from the sender name and subject", async () => {
    await submitContact(buildContactInput({ name: "Jane", subject: "Custom Subject" }));
    const params = axios.post.mock.calls[0][1];
    expect(params.get("subject")).toBe("SITE MESSAGE FROM Jane | SUBJECT: Custom Subject");
  });

  it("falls back to 'No subject provided' in the mail body when subject is omitted", async () => {
    const input = buildContactInput();
    delete input.subject;
    await submitContact(input);
    const params = axios.post.mock.calls[0][1];
    expect(params.get("html")).toContain("No subject provided");
  });

  it("escapes HTML from name/message and converts newlines to <br> in the mail body", async () => {
    await submitContact(buildContactInput({ name: "<script>alert(1)</script>", message: "line1\nline2" }));
    const html = axios.post.mock.calls[0][1].get("html");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("line1<br>line2");
  });

  it("strips newline header-injection attempts out of the mail subject", async () => {
    await submitContact(buildContactInput({ name: "Evil\r\nBcc: attacker@evil.test" }));
    const subject = axios.post.mock.calls[0][1].get("subject");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("does not throw when name is missing", async () => {
    const input = buildContactInput();
    delete input.name;
    const result = await submitContact(input);
    expect(result.success).toBe(true);
  });
});

describe("submitContact — newsletter opt-in", () => {
  it("adds the email to the subscribers collection when newsletter is true", async () => {
    await submitContact(buildContactInput({ newsletter: true }));
    const subs = readCollection(SUBSCRIBERS);
    expect(subs).toHaveLength(1);
    expect(subs[0].email).toBe("jane@example.test");
  });

  it("does not touch the subscribers collection when newsletter is not set", async () => {
    await submitContact(buildContactInput());
    expect(readCollection(SUBSCRIBERS)).toHaveLength(0);
  });

  it("still succeeds without duplicating when the email is already subscribed", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "jane@example.test", date: new Date() }]);
    const result = await submitContact(buildContactInput({ newsletter: true }));
    expect(result.success).toBe(true);
    expect(readCollection(SUBSCRIBERS)).toHaveLength(1);
  });

  it("records the newsletter flag on the stored contact document", async () => {
    await submitContact(buildContactInput({ newsletter: true }));
    expect(readCollection(CONTACTS)[0].newsletter).toBe(true);
  });
});

describe("submitContact — mail failure", () => {
  it("fails the whole request and stores nothing when the mail provider errors (not swallowed)", async () => {
    axios.post.mockRejectedValueOnce(new Error("Mailgun down"));

    const result = await submitContact(buildContactInput());

    expect(result).toEqual({ success: false, message: "Failed to send email" });
    expect(readCollection(CONTACTS)).toHaveLength(0);
  });
});
