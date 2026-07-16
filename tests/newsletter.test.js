import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getUniqueItem: vi.fn(),
  storeAny: vi.fn(),
  deleteItem: vi.fn(),
  getAll: vi.fn(),
}));

const collectionMocks = vi.hoisted(() => ({
  deleteOne: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("../models/db-model.js", () => ({
  default: class {
    constructor(dataObject, collection) {
      this.dataObject = dataObject;
      this.collection = collection;
    }
    getUniqueItem() {
      return dbMocks.getUniqueItem(this.dataObject);
    }
    storeAny() {
      return dbMocks.storeAny(this.dataObject);
    }
    deleteItem() {
      return dbMocks.deleteItem(this.dataObject);
    }
    getAll() {
      return dbMocks.getAll(this.dataObject);
    }
  },
}));

vi.mock("../middleware/db-config.js", () => ({
  dbConnect: vi.fn(),
  dbGet: () => ({ collection: () => collectionMocks }),
}));

vi.mock("../src/mailer.js", () => ({ sendMail: vi.fn() }));

import { ObjectId } from "mongodb";
import {
  getSubscribers,
  storeSubscriber,
  notifyAdminOfSubscription,
  deleteSubscriber,
  getNewsletters,
  dispatchNewsletter,
  sendTestNewsletter,
  deleteNewsletter,
  updateNewsletter,
} from "../src/newsletter.js";
import { sendMail } from "../src/mailer.js";

process.env.SUBSCRIBERS_COLLECTION = "subscribers-test";
process.env.NEWSLETTER_COLLECTION = "newsletter-test";
process.env.EMAIL_USER = "shop@test.com";
process.env.EMAIL_RECIPIENT_1 = "admin@test.com";
delete process.env.EMAIL_RECIPIENT_2;
delete process.env.NEWSLETTER_FROM;
process.env.SITE_URL = "https://art.test/";

const VALID_MONGO_ID = "507f1f77bcf86cd799439011";

beforeEach(() => {
  dbMocks.getUniqueItem.mockReset();
  dbMocks.storeAny.mockReset();
  dbMocks.deleteItem.mockReset();
  dbMocks.getAll.mockReset();
  collectionMocks.deleteOne.mockReset();
  collectionMocks.updateOne.mockReset();
  sendMail.mockReset();
});

describe("storeSubscriber", () => {
  it("fails when no email is provided", async () => {
    expect(await storeSubscriber(null)).toEqual({ success: false, message: "No email provided" });
  });

  it("reports duplicates without storing again", async () => {
    dbMocks.getUniqueItem.mockResolvedValue({ email: "a@x.com" });

    const result = await storeSubscriber("a@x.com");

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(dbMocks.storeAny).not.toHaveBeenCalled();
  });

  it("stores a new subscriber with a date", async () => {
    dbMocks.getUniqueItem.mockResolvedValue(null);
    dbMocks.storeAny.mockResolvedValue({ insertedId: "s1" });

    const result = await storeSubscriber("new@x.com");

    expect(result.success).toBe(true);
    const stored = dbMocks.storeAny.mock.calls[0][0];
    expect(stored.email).toBe("new@x.com");
    expect(stored.date).toBeInstanceOf(Date);
  });
});

describe("deleteSubscriber", () => {
  it("fails when no email is provided", async () => {
    expect(await deleteSubscriber(null)).toEqual({ success: false, message: "No email provided" });
  });

  it("removes an existing subscriber", async () => {
    dbMocks.deleteItem.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteSubscriber("a@x.com");

    expect(result.success).toBe(true);
    expect(dbMocks.deleteItem.mock.calls[0][0]).toMatchObject({ keyToLookup: "email", itemValue: "a@x.com" });
  });
});

describe("notifyAdminOfSubscription", () => {
  it("emails the configured admin recipients", async () => {
    sendMail.mockResolvedValue({ messageId: "m1" });

    await notifyAdminOfSubscription("new@x.com");

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("admin@test.com");
    expect(mail.text).toContain("new@x.com");
  });
});

describe("dispatchNewsletter", () => {
  const subscribers = [{ email: "a@x.com" }, { email: "b@x.com" }];

  it("fails without input, content, or subscribers", async () => {
    expect((await dispatchNewsletter(null)).success).toBe(false);
    expect((await dispatchNewsletter({ subject: "Hi" })).success).toBe(false);

    dbMocks.getAll.mockResolvedValue([]);
    expect((await dispatchNewsletter({ subject: "Hi", html: "<p>Hello</p>" })).success).toBe(false);
  });

  it("BCCs all subscribers plus admin and sanitizes the subject", async () => {
    dbMocks.getAll.mockResolvedValue(subscribers);
    dbMocks.storeAny.mockResolvedValue({ insertedId: "n1" });
    sendMail.mockResolvedValue({ messageId: "m1" });

    const result = await dispatchNewsletter({ subject: "July\r\nShow", html: "<p>Hello</p>" });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("m1");
    const mail = sendMail.mock.calls[0][0];
    expect(mail.bcc).toBe("a@x.com, b@x.com, admin@test.com");
    expect(mail.subject).toBe("JulyShow");
  });

  it("rewrites newsletter image URLs to the site domain and injects email-safe styles", async () => {
    dbMocks.getAll.mockResolvedValue(subscribers);
    dbMocks.storeAny.mockResolvedValue({ insertedId: "n1" });
    sendMail.mockResolvedValue({ messageId: "m1" });

    const html = `<p>New work</p><img src="http://localhost:1991/images/newsletter/pic.jpg">`;
    await dispatchNewsletter({ subject: "Show", html });

    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).toContain(`src="https://art.test/images/newsletter/pic.jpg"`);
    expect(mail.html).toContain(`<img style="max-width: 100%; height: auto; display: block;" width="600"`);
    expect(mail.html).toContain(`<p style="margin: 0 0 1em 0;">New work</p>`);
  });

  it("stores the sent newsletter", async () => {
    dbMocks.getAll.mockResolvedValue(subscribers);
    dbMocks.storeAny.mockResolvedValue({ insertedId: "n1" });
    sendMail.mockResolvedValue({ messageId: "m1" });

    await dispatchNewsletter({ subject: "Show", html: "<p>Hello</p>" });

    expect(dbMocks.storeAny).toHaveBeenCalledTimes(1);
    expect(dbMocks.storeAny.mock.calls[0][0].messageId).toBe("m1");
  });

  it("fails gracefully when sending throws", async () => {
    dbMocks.getAll.mockResolvedValue(subscribers);
    sendMail.mockRejectedValue(new Error("mailgun down"));

    const result = await dispatchNewsletter({ subject: "Show", html: "<p>Hello</p>" });

    expect(result).toEqual({ success: false, message: "Failed to send newsletter" });
  });
});

describe("sendTestNewsletter", () => {
  it("sends only to admin recipients with a [TEST] subject prefix", async () => {
    sendMail.mockResolvedValue({ messageId: "m1" });

    const result = await sendTestNewsletter({ subject: "Show", html: "<p>Hello</p>" });

    expect(result.success).toBe(true);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("admin@test.com");
    expect(mail.subject).toBe("[TEST] Show");
    expect(mail.bcc).toBeUndefined();
  });

  it("fails without content", async () => {
    expect((await sendTestNewsletter({ subject: "Show" })).success).toBe(false);
  });
});

describe("getNewsletters", () => {
  it("returns an empty array when none exist", async () => {
    dbMocks.getAll.mockResolvedValue(null);
    expect(await getNewsletters()).toEqual([]);
  });

  it("formats newsletters newest-first with defaults", async () => {
    const olderId = new ObjectId("00000001" + "0".repeat(16));
    const newerId = new ObjectId("00000002" + "0".repeat(16));
    dbMocks.getAll.mockResolvedValue([
      { _id: olderId, subject: "First Show", html: "<p>1</p>" },
      { _id: newerId }, // no subject/html/text
    ]);

    const result = await getNewsletters();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(newerId.toString());
    expect(result[0].subject).toBe("(No Subject)");
    expect(result[0].sentAt).toEqual(newerId.getTimestamp());
    expect(result[1].subject).toBe("First Show");
  });
});

describe("deleteNewsletter", () => {
  it("fails on a missing or non-string id", async () => {
    expect((await deleteNewsletter(null)).success).toBe(false);
    expect((await deleteNewsletter(123)).success).toBe(false);
  });

  it("fails on an invalid ObjectId string", async () => {
    const result = await deleteNewsletter("not-a-mongo-id");
    expect(result).toEqual({ success: false, message: "Invalid newsletter ID" });
  });

  it("reports not-found when nothing is deleted", async () => {
    collectionMocks.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const result = await deleteNewsletter(VALID_MONGO_ID);
    expect(result).toEqual({ success: false, message: "Newsletter not found" });
  });

  it("deletes an existing newsletter", async () => {
    collectionMocks.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const result = await deleteNewsletter(VALID_MONGO_ID);
    expect(result.success).toBe(true);
  });
});

describe("updateNewsletter", () => {
  it("fails without id or content", async () => {
    expect((await updateNewsletter(null, "<p>x</p>")).success).toBe(false);
    expect((await updateNewsletter(VALID_MONGO_ID, null)).success).toBe(false);
  });

  it("updates only the html field", async () => {
    collectionMocks.updateOne.mockResolvedValue({ matchedCount: 1 });

    const result = await updateNewsletter(VALID_MONGO_ID, "<p>updated</p>");

    expect(result.success).toBe(true);
    const [filter, update] = collectionMocks.updateOne.mock.calls[0];
    expect(filter._id).toBeInstanceOf(ObjectId);
    expect(update).toEqual({ $set: { html: "<p>updated</p>" } });
  });

  it("reports not-found when nothing matches", async () => {
    collectionMocks.updateOne.mockResolvedValue({ matchedCount: 0 });
    const result = await updateNewsletter(VALID_MONGO_ID, "<p>x</p>");
    expect(result).toEqual({ success: false, message: "Newsletter not found" });
  });
});

describe("getSubscribers", () => {
  it("returns all subscribers", async () => {
    const subs = [{ email: "a@x.com" }];
    dbMocks.getAll.mockResolvedValue(subs);
    expect(await getSubscribers()).toBe(subs);
  });
});
