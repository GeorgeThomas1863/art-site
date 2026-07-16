import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  storeAny: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
  },
}));

vi.mock("../src/mailer.js", () => ({ sendMail: vi.fn() }));
vi.mock("../src/newsletter.js", () => ({ storeSubscriber: vi.fn() }));

import { submitContact } from "../src/contact.js";
import { sendMail } from "../src/mailer.js";
import { storeSubscriber } from "../src/newsletter.js";

process.env.EMAIL_USER = "shop@test.com";
process.env.EMAIL_RECIPIENT_1 = "admin@test.com";
delete process.env.EMAIL_RECIPIENT_2;
process.env.CONTACTS_COLLECTION = "contacts-test";

const buildParams = (overrides = {}) => ({
  name: "Bob Buyer",
  email: "bob@test.com",
  subject: "Commission inquiry",
  message: "I love your work.\nCan you paint my dog?",
  newsletter: false,
  ...overrides,
});

beforeEach(() => {
  dbMocks.storeAny.mockReset();
  sendMail.mockReset();
  storeSubscriber.mockReset();
});

const setupHappyPath = () => {
  sendMail.mockResolvedValue({ messageId: "m1" });
  dbMocks.storeAny.mockResolvedValue({ insertedId: "c1" });
};

describe("submitContact validation", () => {
  it("fails without input", async () => {
    expect((await submitContact(null)).success).toBe(false);
  });

  it("rejects invalid and injection-attempt emails", async () => {
    expect((await submitContact(buildParams({ email: "not-an-email" }))).success).toBe(false);
    expect((await submitContact(buildParams({ email: "a@b.com\r\nBcc: x@y.com" }))).success).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("submitContact newsletter signup", () => {
  it("subscribes the sender when the newsletter box is checked", async () => {
    setupHappyPath();
    storeSubscriber.mockResolvedValue({ success: true });

    const result = await submitContact(buildParams({ newsletter: true }));

    expect(result.success).toBe(true);
    expect(storeSubscriber).toHaveBeenCalledWith("bob@test.com");
  });

  it("continues when the email is already subscribed", async () => {
    setupHappyPath();
    storeSubscriber.mockResolvedValue({ success: true, duplicate: true, message: "Email already subscribed" });

    const result = await submitContact(buildParams({ newsletter: true }));

    expect(result.success).toBe(true);
  });

  it("fails when the subscription fails", async () => {
    storeSubscriber.mockResolvedValue({ success: false, message: "Failed to add email to newsletter" });

    const result = await submitContact(buildParams({ newsletter: true }));

    expect(result).toEqual({ success: false, message: "Failed to add email to newsletter" });
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("submitContact email construction", () => {
  it("escapes HTML in user input and converts message newlines to <br>", async () => {
    setupHappyPath();

    await submitContact(buildParams({ name: `<script>alert("x")</script>`, message: "line one\nline two" }));

    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("line one<br>line two");
  });

  it("strips header-injection newlines from the subject line", async () => {
    setupHappyPath();

    await submitContact(buildParams({ name: "Bob\r\nBcc: evil@x.com", subject: "Hi\r\nthere" }));

    const mail = sendMail.mock.calls[0][0];
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("sends to admin recipients with the sender as reply-to", async () => {
    setupHappyPath();

    await submitContact(buildParams());

    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("admin@test.com");
    expect(mail.replyTo).toBe("bob@test.com");
  });
});

describe("submitContact outcomes", () => {
  it("succeeds and stores the contact record", async () => {
    setupHappyPath();

    const result = await submitContact(buildParams());

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("m1");
    expect(dbMocks.storeAny).toHaveBeenCalledTimes(1);
  });

  it("fails when the email cannot be sent", async () => {
    sendMail.mockRejectedValue(new Error("mailgun down"));

    const result = await submitContact(buildParams());

    expect(result).toEqual({ success: false, message: "Failed to send email" });
  });

  it("fails when the contact record cannot be stored", async () => {
    sendMail.mockResolvedValue({ messageId: "m1" });
    dbMocks.storeAny.mockResolvedValue(null);

    const result = await submitContact(buildParams());

    expect(result).toEqual({ success: false, message: "Failed to store email data" });
  });
});
