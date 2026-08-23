// Runs before every test file (see vitest.config.js).
// 1. Sets fake, non-secret env values so src/ modules never read a real .env.
// 2. Replaces the three modules with import-time side effects (Mongo connect, Square client).
//    Everything under src/ can then be imported safely in any test.

import { vi, afterEach } from "vitest";

//---------- fake environment ----------

const TEST_ENV = {
  NODE_ENV: "test",
  PORT: "0",
  SESSION_SECRET: "test-session-secret",
  ADMIN_PW: "test-admin-pw",
  SITE_URL: "http://localhost:0",
  TAX_RATE: "0.06",
  SHIPPING_ZIP: "20500",
  UPLOAD_SIZE_LIMIT_MB: "5",

  MONGO_URI: "mongodb://fake",
  DB_NAME: "fake-db",
  PRODUCTS_COLLECTION: "products",
  CATEGORIES_COLLECTION: "categories",
  EVENTS_COLLECTION: "events",
  ORDERS_COLLECTION: "orders",
  CUSTOMERS_COLLECTION: "customers",
  CONTACTS_COLLECTION: "contacts",
  SUBSCRIBERS_COLLECTION: "subscribers",
  NEWSLETTER_COLLECTION: "newsletters",

  MAILGUN_BASE_URL: "https://api.mailgun.test",
  MAILGUN_DOMAIN: "mg.example.test",
  MAILGUN_API_KEY: "fake-mailgun-key",
  EMAIL_USER: "shop@example.test",
  EMAIL_RECIPIENT_1: "admin1@example.test",
  EMAIL_RECIPIENT_2: "admin2@example.test",
  NEWSLETTER_FROM: "news@example.test",

  SQUARE_TOKEN: "fake-square-token",
  SQUARE_LOCATION_ID: "FAKE_LOCATION",
  SQUARE_APP_ID: "fake-square-app-id",
  SQUARE_ENV: "sandbox",

  SHIP_STATION_BASE_URL: "https://api.shipengine.test/v1",
  SHIP_STATION_API_KEY: "fake-shipengine-key",
};

for (const key of Object.keys(TEST_ENV)) {
  process.env[key] = TEST_ENV[key];
}

//---------- global module replacements ----------

vi.mock("../models/db-model.js", async () => {
  const { FakeDbModel } = await import("./helpers/fake-db.js");
  return { default: FakeDbModel };
});

vi.mock("../middleware/db-config.js", () => {
  return {
    dbConnect: vi.fn(async () => {}),
    dbGet: vi.fn(() => {
      throw new Error("dbGet() is not available in unit tests — use FakeDbModel via seedCollection()");
    }),
  };
});

vi.mock("../middleware/square-config.js", () => {
  return {
    default: {
      payments: {
        create: vi.fn(),
      },
    },
  };
});

//---------- per-test cleanup ----------

afterEach(async () => {
  const { resetFakeDb } = await import("./helpers/fake-db.js");
  resetFakeDb();
});
