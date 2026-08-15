# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — run locally (nodemon app.js). App binds `127.0.0.1:$PORT`; browse via `http://localhost:<PORT>` (Square sandbox checkout is verified against `localhost`, not `127.0.0.1`).
- `npm test` — full Vitest suite, run once.
- `npx vitest run tests/cart.test.js` — single file. `npm run test:watch` — watch mode.

## Environment — read before running anything

- `middleware/env-config.js` loads `.env` (shared config), then `.env.local` (per-machine overrides + secrets, wins). Env files are permission-blocked from reads; the full list of var names (with fake values) is in `tests/setup.js` → `TEST_ENV`.
- **Square defaults to PRODUCTION when `SQUARE_ENV` is unset** — deliberate, the deployed box has no var. For local work set `SQUARE_ENV=sandbox` in `.env.local`, which then also requires sandbox `SQUARE_APP_ID` + `SQUARE_LOCATION_ID` there (`getSquareConfigControl` fails loud otherwise).
- **`MAIL_MODE=log`** makes `src/mailer.js` log instead of calling Mailgun. Anything else sends real email.
- Shipping env vars are named `SHIP_STATION_*` but the API behind them is ShipEngine.

## Architecture

ESM (`"type": "module"`), Express 5, raw MongoDB driver (no mongoose), vanilla-JS frontend, no build step, no lint step.

Request flow: `routes/router.js` (single router, every route) → `controllers/` → `src/` (business logic, one module per domain) → `models/db-model.js` → `middleware/db-config.js`.

- `controllers/data-controller.js` holds nearly every API endpoint (`<name>Control` functions); `display-controller.js` serves the static pages in `html/`; `auth-controller.js` + `middleware/auth-config.js` session-gate `/admin` and all admin POST routes.
- `app.js` has import-time side effects (dotenv, `dbConnect()`, `listen()`). Never import it from a test. The comment block at the top is the project todo list — leave it alone.
- `models/db-model.js` is one generic `dbModel` class (constructor: `dataObject` + collection name). All Mongo access goes through it; it applies `src/sanitize.js` internally. Don't call `dbGet()` directly from `src/`.
- Cart, shipping rates, and admin auth all live in `req.session` (express-session, in-memory). Carts are not in Mongo — a server restart empties them.
- Checkout: `placeOrderControl` → `src/orders.js` → Square client (`middleware/square-config.js`) + ShipEngine via axios (`src/shipping.js`) + Mailgun via axios (`src/mailer.js`).
- Uploads: multer in `src/upload-back.js` → `public/images/*`, sharp resize for newsletter images.

Frontend (`public/js/`): `forms/` = per-page DOM + fetch wiring; `helpers/` = per-page logic (`buy-run.js` = Square payment form, `admin-*.js` = admin panel); `util/define-things.js` = shared state and DOM lookups used across pages.

## Tests

`tests/README.md` is authoritative — read it before writing or changing tests. Non-negotiables: no supertest; never import `app.js`; `db-model`, `db-config`, and `square-config` are globally mocked in `tests/setup.js` (use `FakeDbModel` via `seedCollection()`/`readCollection()` from `tests/helpers/fake-db.js`); axios is NOT globally mocked — mock it per test file; controllers are tested by calling them directly with hand-built `req`/`res` (`tests/helpers/mock-req.js`).

## Conventions

- Queries return data or null; operations return `{ success, message }`; guard clauses at top; `for` loops over `.forEach`/`.map`/`.filter`/`.reduce`.
- Match this repo's existing patterns (sibling repo `boxes-store` is the reference). Do not introduce new architecture, frameworks, or single-use abstractions.
