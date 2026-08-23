// src/newsletter.js manages subscribers (via the globally faked dbModel) and newsletter
// archive rows delete/update (via dbGet() called directly — see the local vi.mock below).
// Mail goes out through mailer.js -> axios, so axios is mocked here per file, not globally.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("axios", () => {
  return { default: { post: vi.fn() } };
});

// newsletter.js bypasses the globally-faked dbModel for delete/update and calls dbGet()
// directly with new ObjectId(id). setup.js's dbGet() throws by design, so this file
// overrides the mock locally with a tiny in-memory store. vi.hoisted is required because
// vi.mock factories are hoisted above the rest of the file, before a plain `let` would
// be initialized.
const dbState = vi.hoisted(() => {
  return { store: [] };
});

vi.mock("../middleware/db-config.js", () => {
  return {
    dbConnect: vi.fn(async () => {}),
    dbGet: vi.fn(() => ({
      collection: () => ({
        deleteOne: async (filter) => {
          const idStr = filter._id.toString();
          const index = dbState.store.findIndex((doc) => doc._id.toString() === idStr);
          if (index === -1) return { acknowledged: true, deletedCount: 0 };
          dbState.store.splice(index, 1);
          return { acknowledged: true, deletedCount: 1 };
        },
        updateOne: async (filter, update) => {
          const idStr = filter._id.toString();
          const doc = dbState.store.find((d) => d._id.toString() === idStr);
          if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
          Object.assign(doc, update.$set);
          return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
        },
      }),
    })),
  };
});

import axios from "axios";
import { ObjectId } from "mongodb";
import {
  getSubscribers,
  storeSubscriber,
  notifyAdminOfSubscription,
  deleteSubscriber,
  getNewsletters,
  dispatchNewsletter,
  sendTestNewsletter,
  announceProduct,
  deleteNewsletter,
  updateNewsletter,
} from "../src/newsletter.js";
import { FakeDbModel, seedCollection, readCollection } from "./helpers/fake-db.js";

const SUBSCRIBERS = process.env.SUBSCRIBERS_COLLECTION;
const NEWSLETTERS = process.env.NEWSLETTER_COLLECTION;

const okMailResponse = { status: 200, data: { id: "<msg-1@mg.example.test>" } };

const lastPostCall = () => {
  const [url, params, config] = axios.post.mock.calls[axios.post.mock.calls.length - 1];
  return { url, params, config };
};

beforeEach(() => {
  dbState.store.length = 0;
});

//---------- subscribers ----------

describe("getSubscribers", () => {
  it("returns every doc in the subscribers collection", async () => {
    seedCollection(SUBSCRIBERS, [
      { email: "a@example.test", date: new Date() },
      { email: "b@example.test", date: new Date() },
    ]);
    const result = await getSubscribers();
    expect(result.map((s) => s.email)).toEqual(["a@example.test", "b@example.test"]);
  });

  it("returns an empty array when there are no subscribers", async () => {
    expect(await getSubscribers()).toEqual([]);
  });
});

describe("storeSubscriber", () => {
  it("rejects when no email is provided", async () => {
    expect(await storeSubscriber()).toEqual({ success: false, message: "No email provided" });
    expect(readCollection(SUBSCRIBERS)).toEqual([]);
  });

  it("adds a new subscriber and reports success", async () => {
    const result = await storeSubscriber("new@example.test");
    expect(result).toMatchObject({ success: true, message: "Email added to newsletter", acknowledged: true });
    expect(readCollection(SUBSCRIBERS)).toHaveLength(1);
    expect(readCollection(SUBSCRIBERS)[0].email).toBe("new@example.test");
  });

  it("reports a duplicate instead of inserting a second row for the same email", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "dupe@example.test", date: new Date() }]);

    const result = await storeSubscriber("dupe@example.test");

    expect(result).toEqual({
      success: true,
      duplicate: true,
      message: "Email already subscribed",
      email: "dupe@example.test",
    });
    expect(readCollection(SUBSCRIBERS)).toHaveLength(1);
  });

  it("BUG: accepts any truthy string as an email — there is no format validation", async () => {
    // src/newsletter.js imports only sanitizeEmailHeader from ./sanitize.js, never
    // validateEmail. storeSubscriber's only guard is `if (!email)`, so garbage strings
    // are stored as-is. Flagged in the report; not fixed here per the test-writing brief.
    const result = await storeSubscriber("not-an-email");
    expect(result.success).toBe(true);
    expect(readCollection(SUBSCRIBERS)[0].email).toBe("not-an-email");
  });
});

describe("notifyAdminOfSubscription", () => {
  it("emails both admin recipients about the new subscriber", async () => {
    axios.post.mockResolvedValue(okMailResponse);

    await notifyAdminOfSubscription("jane@example.test");

    const { params } = lastPostCall();
    expect(params.get("to")).toBe("admin1@example.test, admin2@example.test");
    expect(params.get("from")).toBe(process.env.EMAIL_USER);
    expect(params.get("subject")).toBe("New Newsletter Subscriber");
    expect(params.get("text")).toContain("jane@example.test");
  });

  it("does nothing when no admin recipients are configured", async () => {
    const saved1 = process.env.EMAIL_RECIPIENT_1;
    const saved2 = process.env.EMAIL_RECIPIENT_2;
    delete process.env.EMAIL_RECIPIENT_1;
    delete process.env.EMAIL_RECIPIENT_2;

    try {
      const result = await notifyAdminOfSubscription("jane@example.test");
      expect(result).toBeUndefined();
      expect(axios.post).not.toHaveBeenCalled();
    } finally {
      process.env.EMAIL_RECIPIENT_1 = saved1;
      process.env.EMAIL_RECIPIENT_2 = saved2;
    }
  });
});

describe("deleteSubscriber", () => {
  it("rejects when no email is provided", async () => {
    expect(await deleteSubscriber()).toEqual({ success: false, message: "No email provided" });
  });

  it("removes the matching subscriber", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "gone@example.test", date: new Date() }]);

    const result = await deleteSubscriber("gone@example.test");

    expect(result).toMatchObject({ success: true, message: "Email removed from newsletter", deletedCount: 1 });
    expect(readCollection(SUBSCRIBERS)).toEqual([]);
  });

  it("BUG: reports success even when the email was never subscribed", async () => {
    // deleteSubscriber only guards on `if (!removeData)`. FakeDbModel.deleteItem() (and the
    // real Mongo deleteOne result) is a truthy object even when deletedCount is 0, so a
    // no-op delete is reported as success. deleteNewsletter, below, gets this right by
    // checking result.deletedCount === 0 — this is an inconsistency in the same file.
    const result = await deleteSubscriber("never-subscribed@example.test");
    expect(result).toEqual({ success: true, message: "Email removed from newsletter", acknowledged: true, deletedCount: 0 });
  });
});

//---------- newsletter archive ----------

describe("getNewsletters", () => {
  it("returns an empty array when there are no newsletters", async () => {
    expect(await getNewsletters()).toEqual([]);
  });

  it("returns newest first and derives sentAt from the ObjectId timestamp", async () => {
    const older = new ObjectId();
    const newer = new ObjectId();
    seedCollection(NEWSLETTERS, [
      { _id: older, subject: "First", html: "<p>old</p>", text: "old text" },
      { _id: newer, subject: "Second", html: "<p>new</p>", text: "new text" },
    ]);

    const result = await getNewsletters();

    expect(result.map((n) => n.id)).toEqual([newer.toString(), older.toString()]);
    expect(result[0]).toMatchObject({ subject: "Second", html: "<p>new</p>", text: "new text" });
    expect(result[0].sentAt).toEqual(newer.getTimestamp());
  });

  it("defaults subject/html/text when the stored doc omits them", async () => {
    seedCollection(NEWSLETTERS, [{ _id: new ObjectId() }]);
    const [result] = await getNewsletters();
    expect(result).toMatchObject({ subject: "(No Subject)", html: "", text: "" });
  });
});

describe("dispatchNewsletter", () => {
  it("appends an escaped button and archives the final html", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);
    await dispatchNewsletter({ subject: "News", html: "<p>Body</p>", buttonText: "View <Now>", buttonUrl: 'https://example.test/a?x=1&y="2"' });
    const html = lastPostCall().params.get("html");
    expect(html).toContain("View &lt;Now&gt;");
    expect(html).toContain('href="https://example.test/a?x=1&amp;y=&quot;2&quot;"');
    expect(html).toContain('<table role="presentation"');
    expect(readCollection(NEWSLETTERS)[0].html).toBe(html);
  });

  it("omits blank buttons and rejects incomplete or non-http buttons", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);
    await dispatchNewsletter({ subject: "News", html: "<p>Body</p>", buttonText: " ", buttonUrl: "" });
    expect(lastPostCall().params.get("html")).not.toContain('<table role="presentation"');
    expect(await dispatchNewsletter({ subject: "News", html: "x", buttonText: "View" })).toEqual({ success: false, message: "Button text and link are both required" });
    expect(await dispatchNewsletter({ subject: "News", html: "x", buttonText: "View", buttonUrl: "/local" })).toEqual({ success: false, message: "Button link must start with http:// or https://" });
  });
  it("rejects missing input", async () => {
    expect(await dispatchNewsletter()).toEqual({ success: false, message: "No input parameters" });
  });

  it("rejects when neither html nor message is provided", async () => {
    expect(await dispatchNewsletter({ subject: "Hi" })).toEqual({ success: false, message: "No message provided" });
  });

  it("fails when there are no subscribers", async () => {
    const result = await dispatchNewsletter({ subject: "Hi", message: "Hello" });
    expect(result).toEqual({ success: false, message: "No subscribers found" });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("bccs every subscriber plus both admin recipients, and sends from/to NEWSLETTER_FROM", async () => {
    // Note: dispatchNewsletter pre-joins bcc into a single comma-separated string before
    // calling sendMail, unlike sendMail's own support for a bcc array (see mailer.test.js's
    // "appends every bcc address separately" case). The result is one "bcc" form field
    // holding all four addresses, not four repeated fields.
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }, { email: "sub2@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);

    const result = await dispatchNewsletter({ subject: "News", message: "Plain text body" });

    expect(result).toEqual({ success: true, message: "Newsletter sent successfully", messageId: "<msg-1@mg.example.test>" });
    const { params } = lastPostCall();
    expect(params.get("from")).toBe("news@example.test");
    expect(params.get("to")).toBe("news@example.test");
    expect(params.getAll("bcc")).toEqual(["sub1@example.test, sub2@example.test, admin1@example.test, admin2@example.test"]);
    expect(params.get("text")).toBe("Plain text body");
    expect(params.has("html")).toBe(false);
  });

  it("strips newlines from the subject to prevent header injection", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);

    await dispatchNewsletter({ subject: "Sale\r\nBcc: evil@attacker.test", message: "Hi" });

    expect(lastPostCall().params.get("subject")).toBe("SaleBcc: evil@attacker.test");
  });

  it("rewrites /images/newsletter/ src to the absolute site URL and adds default img/p inline styles", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);

    await dispatchNewsletter({ subject: "News", html: '<img src="/images/newsletter/pic.png"><p>Hi</p>' });

    const html = lastPostCall().params.get("html");
    expect(html).toBe(
      '<img style="max-width: 100%; height: auto; display: block;" width="600" src="http://localhost:0/images/newsletter/pic.png"><p style="margin: 0 0 1em 0;">Hi</p>'
    );
  });

  it("does not add a style attribute to an <img> that already has one", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);

    await dispatchNewsletter({ subject: "News", html: '<img style="border:0" src="/images/newsletter/pic.png">' });

    expect(lastPostCall().params.get("html")).toBe('<img style="border:0" src="http://localhost:0/images/newsletter/pic.png">');
  });

  it("stores a record of the sent newsletter in the archive collection", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);

    await dispatchNewsletter({ subject: "News", message: "Hi" });

    const stored = readCollection(NEWSLETTERS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ subject: "News", messageId: "<msg-1@mg.example.test>" });
  });

  it("returns a failure (not a throw) when Mailgun errors", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockRejectedValue(new Error("502 Bad Gateway"));

    const result = await dispatchNewsletter({ subject: "News", message: "Hi" });

    expect(result).toEqual({ success: false, message: "Failed to send newsletter" });
    expect(readCollection(NEWSLETTERS)).toEqual([]);
  });

  it("still reports success when the archive write fails after the mail went out", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);
    const storeSpy = vi.spyOn(FakeDbModel.prototype, "storeAny").mockRejectedValueOnce(new Error("insert failed"));

    const result = await dispatchNewsletter({ subject: "News", message: "Hi" });
    storeSpy.mockRestore();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, message: "Newsletter sent, but archiving a copy failed", messageId: "<msg-1@mg.example.test>" });
    expect(readCollection(NEWSLETTERS)).toEqual([]);
  });
});

describe("sendTestNewsletter", () => {
  it("omits button markup when both button fields are blank or absent", async () => {
    axios.post.mockResolvedValue(okMailResponse);
    const inputs = [
      { buttonText: "", buttonUrl: "" },
      { buttonText: "   ", buttonUrl: "\t" },
      {},
    ];

    for (const input of inputs) {
      const callsBefore = axios.post.mock.calls.length;
      const result = await sendTestNewsletter({ subject: "News", html: "Message content", ...input });
      expect(result.success).toBe(true);
      expect(axios.post.mock.calls.length).toBe(callsBefore + 1);

      const html = lastPostCall().params.get("html");
      expect(html).toContain("Message content");
      expect(html).not.toContain('role="presentation"');
      expect(html).not.toContain("<a ");
    }
  });

  it("supports escaped buttons and validates button pairs", async () => {
    axios.post.mockResolvedValue(okMailResponse);
    await sendTestNewsletter({ subject: "News", html: "Body", buttonText: "Go & See", buttonUrl: "https://example.test/?a=1&b=2" });
    expect(lastPostCall().params.get("html")).toContain("Go &amp; See");
    expect(await sendTestNewsletter({ subject: "News", html: "Body", buttonUrl: "https://example.test" })).toEqual({ success: false, message: "Button text and link are both required" });
    expect(await sendTestNewsletter({ subject: "News", html: "Body", buttonText: "Go", buttonUrl: "javascript:alert(1)" })).toEqual({ success: false, message: "Button link must start with http:// or https://" });
  });
  it("rejects missing input", async () => {
    expect(await sendTestNewsletter()).toEqual({ success: false, message: "No input parameters" });
  });

  it("rejects when neither html nor message is provided", async () => {
    expect(await sendTestNewsletter({ subject: "Hi" })).toEqual({ success: false, message: "No message provided" });
  });

  it("fails when no admin recipients are configured", async () => {
    const saved1 = process.env.EMAIL_RECIPIENT_1;
    const saved2 = process.env.EMAIL_RECIPIENT_2;
    delete process.env.EMAIL_RECIPIENT_1;
    delete process.env.EMAIL_RECIPIENT_2;

    try {
      const result = await sendTestNewsletter({ subject: "Hi", message: "Body" });
      expect(result).toEqual({ success: false, message: "No recipient addresses configured" });
      expect(axios.post).not.toHaveBeenCalled();
    } finally {
      process.env.EMAIL_RECIPIENT_1 = saved1;
      process.env.EMAIL_RECIPIENT_2 = saved2;
    }
  });

  it("sends only to the admin recipients (no bcc) with a [TEST] subject prefix", async () => {
    axios.post.mockResolvedValue(okMailResponse);

    const result = await sendTestNewsletter({ subject: "News", message: "Body" });

    expect(result).toEqual({ success: true, message: "Test newsletter sent successfully", messageId: "<msg-1@mg.example.test>" });
    const { params } = lastPostCall();
    expect(params.get("to")).toBe("admin1@example.test, admin2@example.test");
    expect(params.get("subject")).toBe("[TEST] News");
    expect(params.has("bcc")).toBe(false);
  });

  it("returns a failure (not a throw) when Mailgun errors", async () => {
    axios.post.mockRejectedValue(new Error("502 Bad Gateway"));

    const result = await sendTestNewsletter({ subject: "News", message: "Body" });

    expect(result).toEqual({ success: false, message: "Failed to send test newsletter" });
  });
});

describe("announceProduct", () => {
  it("sends and archives a complete product announcement with defaults", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "one@example.test" }, { email: "two@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);
    const result = await announceProduct({ name: "Art <One>", price: "12.5", description: "Line 1\nLine 2", urlName: "art-one", picData: [{ filename: "art.jpg" }] }, {});
    expect(result).toMatchObject({ success: true, subscriberCount: 2, messageId: "<msg-1@mg.example.test>" });
    const { params } = lastPostCall();
    expect(params.get("subject")).toBe("New Product: Art <One>");
    expect(params.get("html")).toContain("http://localhost:0/images/products/art.jpg");
    expect(params.get("html")).toContain("$12.50");
    expect(params.get("html")).toContain('href="http://localhost:0/products/art-one"');
    expect(params.getAll("bcc")[0]).toContain("one@example.test, two@example.test");
    expect(readCollection(NEWSLETTERS)).toHaveLength(1);
  });

  it("respects button overrides and omits video images", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "one@example.test" }]);
    axios.post.mockResolvedValue(okMailResponse);
    await announceProduct({ name: "Video", price: 3, description: "Desc", urlName: "video", picData: [{ filename: "clip.mp4" }] }, { buttonText: "Buy", buttonUrl: "https://shop.test/item" });
    const html = lastPostCall().params.get("html");
    expect(html).toContain("Buy");
    expect(html).toContain('href="https://shop.test/item"');
    expect(html).not.toContain("clip.mp4");
  });

  it("returns the subscriber count when none exist", async () => {
    expect(await announceProduct({ name: "Art", urlName: "art" }, {})).toEqual({ success: false, message: "No subscribers found", subscriberCount: 0 });
  });
});

describe("MAIL_MODE=log", () => {
  const LOG_MODE_MESSAGE = "Email NOT sent: server is running with MAIL_MODE=log (logged to console only)";

  beforeEach(() => {
    process.env.MAIL_MODE = "log";
  });

  afterEach(() => {
    delete process.env.MAIL_MODE;
  });

  it("sendTestNewsletter reports log mode instead of a real send", async () => {
    const result = await sendTestNewsletter({ subject: "News", message: "Body" });

    expect(result).toEqual({
      success: true,
      logMode: true,
      message: LOG_MODE_MESSAGE,
      messageId: "log-mode",
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("dispatchNewsletter reports log mode and still archives the newsletter", async () => {
    seedCollection(SUBSCRIBERS, [{ email: "sub1@example.test" }]);

    const result = await dispatchNewsletter({ subject: "News", message: "Hi" });

    expect(result).toEqual({
      success: true,
      logMode: true,
      message: LOG_MODE_MESSAGE,
      messageId: "log-mode",
    });
    expect(axios.post).not.toHaveBeenCalled();
    const stored = readCollection(NEWSLETTERS);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ subject: "News", messageId: "log-mode" });
  });

  it("leaves the success message and logMode untouched when MAIL_MODE is unset", async () => {
    delete process.env.MAIL_MODE;
    axios.post.mockResolvedValue(okMailResponse);

    const result = await sendTestNewsletter({ subject: "News", message: "Body" });

    expect(result).toEqual({ success: true, message: "Test newsletter sent successfully", messageId: "<msg-1@mg.example.test>" });
    expect(result.logMode).toBeUndefined();
  });
});

//---------- direct dbGet() delete / update paths ----------

describe("deleteNewsletter", () => {
  it("rejects a missing or non-string id", async () => {
    expect(await deleteNewsletter()).toEqual({ success: false, message: "No ID provided" });
    expect(await deleteNewsletter(123)).toEqual({ success: false, message: "No ID provided" });
  });

  it("reports an invalid ID instead of throwing when the id is malformed", async () => {
    const result = await deleteNewsletter("not-a-valid-id");
    expect(result).toEqual({ success: false, message: "Invalid newsletter ID" });
  });

  it("reports not found when no doc matches the id", async () => {
    const result = await deleteNewsletter("aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(result).toEqual({ success: false, message: "Newsletter not found" });
  });

  it("deletes the matching doc", async () => {
    const id = new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
    dbState.store.push({ _id: id, html: "<p>original</p>" });

    const result = await deleteNewsletter("aaaaaaaaaaaaaaaaaaaaaaaa");

    expect(result).toEqual({ success: true, message: "Newsletter deleted successfully" });
    expect(dbState.store).toHaveLength(0);
  });
});

describe("updateNewsletter", () => {
  it("rejects a missing or non-string id", async () => {
    expect(await updateNewsletter(undefined, "<p>x</p>")).toEqual({ success: false, message: "No ID provided" });
  });

  it("rejects missing or non-string html", async () => {
    expect(await updateNewsletter("aaaaaaaaaaaaaaaaaaaaaaaa")).toEqual({ success: false, message: "No content provided" });
  });

  it("reports an invalid ID instead of throwing when the id is malformed", async () => {
    const result = await updateNewsletter("not-a-valid-id", "<p>x</p>");
    expect(result).toEqual({ success: false, message: "Invalid newsletter ID" });
  });

  it("reports not found when no doc matches the id", async () => {
    const result = await updateNewsletter("aaaaaaaaaaaaaaaaaaaaaaaa", "<p>x</p>");
    expect(result).toEqual({ success: false, message: "Newsletter not found" });
  });

  it("updates the html of the matching doc", async () => {
    const id = new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
    dbState.store.push({ _id: id, html: "<p>original</p>" });

    const result = await updateNewsletter("aaaaaaaaaaaaaaaaaaaaaaaa", "<p>updated</p>");

    expect(result).toEqual({ success: true, message: "Newsletter updated successfully" });
    expect(dbState.store[0].html).toBe("<p>updated</p>");
  });
});
