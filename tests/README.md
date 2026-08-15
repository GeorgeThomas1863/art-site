# Tests — conventions

Vitest 4. Read this before adding tests.

## Running

- `npm test` — full suite, run once (CI mode).
- `npm run test:watch` — watch mode.
- `npx vitest run tests/cart.test.js` — a single file.

## What `tests/setup.js` does (runs before every file, see `vitest.config.js`)

1. **Fake env.** Sets every env var the app reads (`NODE_ENV`, `MONGO_URI`, `SQUARE_TOKEN`,
   `MAILGUN_API_KEY`, collection names, etc.) to fake, non-secret values. No real `.env` is ever
   read in tests. See `tests/setup.js` for the full list and current values.
2. **Global mocks** (do not re-mock these yourself):
   - `models/db-model.js` → `FakeDbModel`, an in-memory fake. Seed it with
     `seedCollection(name, docs)` and inspect it with `readCollection(name)`, both from
     `tests/helpers/fake-db.js`. State auto-resets after every test (`afterEach` in setup.js).
   - `middleware/db-config.js` → `dbConnect` is a no-op; `dbGet()` **throws by design**. If a
     test needs `dbGet()` to work, that's a sign the code path should go through
     `models/db-model.js` / `FakeDbModel` instead.
   - `middleware/square-config.js` → `{ payments: { create: vi.fn() } }`. Import the default
     export and set `SQ.payments.create.mockResolvedValue(...)` / `mockRejectedValue(...)` per test.

## axios (NOT globally mocked)

Any code under test that calls axios directly (Mailgun mail, ShipEngine) needs its own
`vi.mock("axios")` at the top of *your* test file, then control the mock per test. Follow the
existing pattern in `tests/shipping.test.js` and `tests/mailer.test.js` rather than inventing a
new one.

## Controllers and middleware (no supertest, no importing app.js)

Never import `app.js` in a test — it connects to Mongo and calls `listen()` at import. Test
controllers and middleware the same way every other project here does: import the function
directly and call it with a hand-built `req`/`res`:

```js
import { buildReq } from "./helpers/mock-req.js";

const buildRes = () => {
  return { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn(), sendFile: vi.fn() };
};

const res = buildRes();
await someControl(buildReq({ body: { email: "a@b.test" } }), res);
expect(res.status).toHaveBeenCalledWith(400);
```

## Test helpers

`tests/helpers/mock-req.js` — `buildReq`, `buildCartItem`, `buildProductDoc` for building the
minimal Express-shaped objects that `src/` functions read from directly (non-route unit tests).

## Style

- Match `tests/cart.test.js`: explicit named imports from `"vitest"`, one `describe` block per
  function, plain assertions, no snapshot tests.
- `for` loops over `.forEach`/`.map`/`.filter`/`.reduce` in test setup code, same as production code.
- Every assertion must be able to fail — no tautologies.

## Test actual behavior, don't fix production code here

Tests in this suite cover the app's *current* behavior. If you find what looks like a real
production bug while writing a test, do not patch the production file as part of a test task —
cover the current (buggy) behavior, or skip that one assertion, and flag the bug clearly in your
report instead. Production fixes are a separate, deliberate task.

## Env facts

All env values used in tests live in `tests/setup.js` — nothing here ever touches a real `.env`
or `.env.local` file. If you need a new env var for a test, add it to `TEST_ENV` in
`tests/setup.js`, not to your test file.
