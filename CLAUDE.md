# CLAUDE.md

This a full stack e-commerce webapp. Vanilla JS and CSS frontend (no frameworks, by design). Node.js, Express.js backend, MongoDB database.

Important: You are the orchestrator. subagents execute. you should NOT build, verify, or code inline (if possible). your job is to plan, prioritize & coordinate the acitons of your subagents

Keep your replies extremely concise and focus on providing necessary information.

Put all pictures / screenshots you take wiht hte mcp plugin in the "pics" subfolder, under the .claude folder in THIS project.

## Commands

- `npm start` — NOT NEEDED, the dev server is already running on port 1991. The user will handle testing and validation for now.

## Architecture

### Backend (Node.js/Express, ES Modules)

**Entry point:** `app.js` — Express server setup, session middleware, static file serving, routes.

**Layered structure:**

- `routes/router.js` — all route definitions (single file). Admin routes use `requireAuth` middleware.
- `controllers/` — request handlers split by concern:
  - `data-controller.js` — API endpoint handlers (products, events, cart, shipping, orders, newsletter, contact)
  - `display-controller.js` — serves HTML pages via `sendFile`
  - `auth-controller.js` — admin password auth
- `src/` — business logic modules: `products.js`, `events.js`, `cart.js`, `shipping.js`, `payments.js`, `orders.js`, `newsletter.js`, `contact.js`, `upload-back.js`
- `models/db-model.js` — generic MongoDB model class. All collections use this single class, instantiated with `new dbModel(dataObject, collectionName)`. Key methods: `storeAny()`, `getAll()`, `getUniqueItem()`, `updateObjItem()`, `deleteItem()`, `getMaxId()`, `matchMultiItems()`.
- `middleware/` — `db-config.js` (MongoDB connection), `session-config.js`, `square-config.js` (Square SDK init), `auth-config.js` (session auth guard), `upload-error.js`

### Frontend (Vanilla JavaScript, no framework by choice)

**HTML pages** in `html/` — served statically. Each page has its own CSS file in `public/css/`.

**JavaScript** in `public/js/`:

- `main.js` — page detection and orchestration (calls the right form builder per page)
- `responsive.js` - centralized event handler, all events are handled here
- `forms/` — one form-builder file per page (e.g., `products-form.js`, `cart-form.js`). These construct DOM elements programmatically.
- `helpers/` — feature-specific logic (e.g., `admin-products.js`, `cart-run.js`, `buy-run.js`, `shipping-calc.js`, `square-payment.js`)
- `util/` — shared utilities: `api-front.js` (`sendToBack()` fetch wrapper), `popup.js` (modals), `loading.js`, `debounce.js`, `params.js`, `define-things.js` (constants)

### State Management

- Shopping cart: `req.session.cart` (server-side session)
- Shipping data: `req.session.shipping` (server-side session)
- Auth: `req.session.authenticated` (simple admin password, no user accounts)
- Sessions expire after 24 hours

### Third-Party Integrations

- **Square SDK** — payment processing (sandbox/production via config). Card tokenization on frontend, payment creation on backend (`src/payments.js`). Tax hardcoded at 8%.
- **ShipStation API** — shipping rate calculations via Axios (`src/shipping.js`). Rates fetched by zip code with custom adjustments.
- **Nodemailer** — contact form emails, order confirmations, newsletter sending (`src/contact.js`, `src/newsletter.js`)
- **Multer** — image uploads stored in `public/images/products/` and `public/images/events/`. 10MB limit, allowed types: jpg, jpeg, png, gif, webp.

### Database

MongoDB with native driver (no Mongoose). Collection names come from environment variables (`PRODUCTS_COLLECTION`, `EVENTS_COLLECTION`, `ORDERS_COLLECTION`, `CUSTOMERS_COLLECTION`, `NEWSLETTER_COLLECTION`, `CONTACTS_COLLECTION`). No schema validation — validation is in business logic.

## Environment Variables

Two env files loaded in order: `.env` then `.env.local` (local overrides). Required vars:

- `MONGO_URI`, `DB_NAME`, collection names (see above)
- `ADMIN_PW`, `SESSION_SECRET`
- `SQUARE_TOKEN`, `SQUARE_LOCATION_ID`
- `SHIP_STATION_API_KEY`, `SHIP_STATION_BASE_URL`, `SHIPPING_ZIP`
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_RECIPIENT`
- `PORT`

---

## File Responsibility Map

### Event Handling

| File                                        | Role                                                                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/js/responsive.js`                   | **THE centralized event handler.** All click, keydown, change, and input events are routed here via `data-label` attributes. Never attach event listeners elsewhere.                  |
| **Exception:** `public/js/util/collapse.js` | Attaches its own click listeners directly to collapse headers inside `buildCollapseContainer()` and `defineCollapseItems()`. This is the ONLY file allowed to bypass `responsive.js`. |

### CSS Files — One Per Page, Strict Boundaries

| CSS File              | Scope                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles.css`          | Global reset, body, navbar, hero/homepage, popup notifications, confirm dialogs, password inputs, collapse containers, loading overlay, shared button classes (`.btn-submit`)                         |
| `admin-styles.css`    | Admin dashboard, admin modals, admin forms (`.info-row`, `.status-card`, `.status-select`), action cards, stats, image upload area, selectors, newsletter subscriber list, all `.btn-admin-*` buttons |
| `products-styles.css` | Product grid, product cards, filter bar, category buttons, product detail modal overlay                                                                                                               |
| `cart-styles.css`     | Cart items, quantity controls, cart summary sidebar, shipping calculator section                                                                                                                      |
| `checkout-styles.css` | Checkout form, checkout shipping options, checkout summary                                                                                                                                            |
| `confirm-styles.css`  | Order confirmation display                                                                                                                                                                            |
| `events-styles.css`   | Events page layout, event cards, newsletter signup on events page                                                                                                                                     |
| `about-styles.css`    | About page                                                                                                                                                                                            |
| `contact-styles.css`  | Contact form                                                                                                                                                                                          |
| `auth-styles.css`     | Admin login page                                                                                                                                                                                      |
| `media-styles.css`    | Responsive breakpoints (currently empty — add `@media` queries here)                                                                                                                                  |

### Frontend JS — Form Builders (DOM Construction Only)

| File                     | Builds                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `forms/main-form.js`     | `buildNavBar()`, `buildMainForm()` — navbar with cart icon, hero sections                              |
| `forms/admin-form.js`    | `buildAdminForm()`, `buildModal(mode, entityType)` — admin dashboard and dynamic modals                |
| `forms/products-form.js` | `buildProductsForm()`, `buildProductCard()`, `buildProductDetailModal()`, `buildCategoryDescription()` |
| `forms/cart-form.js`     | `buildCartForm()`, `buildCartItem()`, `buildEmptyCart()`, `buildShippingOption()`                      |
| `forms/checkout-form.js` | `buildCheckoutForm()`, `buildCheckoutItem()`, `buildCheckoutShippingOption()`                          |
| `forms/confirm-form.js`  | `buildConfirmOrderForm()`                                                                              |
| `forms/events-form.js`   | `buildEventsForm()`                                                                                    |
| `forms/about-form.js`    | `buildAboutForm()`                                                                                     |
| `forms/contact-form.js`  | `buildContactForm()`                                                                                   |
| `forms/auth-form.js`     | Auth login form                                                                                        |

### Frontend JS — Helpers (Business Logic)

| File                          | Responsibility                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `helpers/admin-run.js`        | Modal open/close (`runModalTrigger`, `runModalClose`), stats updates (`updateAdminStats`), status card color changes (`runChangeStatusCard`), enable/disable/clear form fields |
| `helpers/admin-products.js`   | Product CRUD: `runAddNewProduct`, `runEditProduct`, `runDeleteProduct`, `changeAdminProductSelector`                                                                           |
| `helpers/admin-events.js`     | Event CRUD: `runAddNewEvent`, `runEditEvent`, `runDeleteEvent`, `changeAdminEventSelector`                                                                                     |
| `helpers/admin-newsletter.js` | `runSendNewsletter`, `runAddSubscriber`, `runRemoveSubscriber`                                                                                                                 |
| `helpers/products-run.js`     | `changeProductsFilterButton`, `populateProducts`, `openProductDetailModal`, `closeProductDetailModal`, `updateCategoryDescription`                                             |
| `helpers/cart-run.js`         | `runAddToCart`, `runIncreaseQuantity`, `runDecreaseQuantity`, `runRemoveFromCart`, `populateCart`, `updateNavbarCart`                                                          |
| `helpers/buy-run.js`          | `runPlaceOrder`, `populateCheckout`, `populateConfirmOrder`                                                                                                                    |
| `helpers/shipping-calc.js`    | `runCalculateShipping` (cart), `runCalculateShippingCheckout` (checkout, debounced), `runShippingOptionSelect`, `runCheckoutShippingOptionSelect`                              |
| `helpers/square-payment.js`   | Square Web Payments SDK init, card tokenization                                                                                                                                |
| `helpers/contact-run.js`      | `runContactSubmit`                                                                                                                                                             |
| `helpers/events-run.js`       | `runEventsNewsletterToggle`, `runEventsNewsletterSubmit`, `populateEvents`                                                                                                     |
| `helpers/rotate-pics.js`      | Image rotation for main/about pages                                                                                                                                            |
| `helpers/upload-pic.js`       | `runUploadClick`, `runUploadPic`, `runDeleteUploadImage`                                                                                                                       |

### Frontend JS — Utilities

| File                    | Exports                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `util/api-front.js`     | `sendToBack(params, method)` for JSON, `sendToBackFile(params)` for FormData — ALL backend calls go through these                                   |
| `util/popup.js`         | `displayPopup(message, type)`, `displayConfirmDialog(message)` (returns promise), `closePopup()`, `closeConfirmDialog(result)`                      |
| `util/loading.js`       | `showLoadStatus(element, text)`, `hideLoadStatus()`                                                                                                 |
| `util/debounce.js`      | Debounce factory (500ms delay, returns promise)                                                                                                     |
| `util/collapse.js`      | `buildCollapseContainer(config)`, `defineCollapseItems(array)`, `hideArray()`, `unhideArray()`                                                      |
| `util/params.js`        | `buildNewProductParams()`, `getEditProductParams()`, `buildNewEventParams()`, `getEditEventParams()`, `getCustomerParams()`, `buildContactParams()` |
| `util/define-things.js` | Constants: SVG icons (eye, arrow, social), US states array                                                                                          |

### Shipping Logic (Full Stack)

| Layer    | File                             | Role                                                                                                                                                                          |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | `helpers/shipping-calc.js`       | ZIP validation, loading overlay, calls backend, builds shipping option UI, pre-selects cheapest, updates summary totals                                                       |
| Frontend | `forms/cart-form.js`             | Builds shipping calculator section and `buildShippingOption()` elements                                                                                                       |
| Frontend | `forms/checkout-form.js`         | Builds `buildCheckoutShippingOption()` elements                                                                                                                               |
| Backend  | `src/shipping.js`                | Aggregates weight/dimensions from cart, enforces 100" girth limit, calls ShipStation API for USPS rates, applies adjustments (+2 days, +$2), stores in `req.session.shipping` |
| Backend  | `controllers/data-controller.js` | Routes shipping requests to `src/shipping.js`                                                                                                                                 |

### Image Upload Pipeline

| Layer    | File                    | Role                                                                                                                                     |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | `helpers/upload-pic.js` | Triggers hidden file input, sends FormData via `sendToBackFile()`, shows preview, stores upload data on button element                   |
| Backend  | `src/upload-back.js`    | Multer config: storage to `public/images/products/` or `public/images/events/`, 10MB limit, file type filter, `deletePic()` for deletion |

### Backend Business Logic (`src/`)

| File                 | Role                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `src/products.js`    | Product CRUD: `storeProduct`, `updateProduct`, `deleteProduct`, `getProductData`             |
| `src/events.js`      | Event CRUD: `storeEvent`, `updateEvent`, `deleteEvent`, `getEventData`                       |
| `src/cart.js`        | Session cart: `buildCart`, `addCartItem`, `updateCartItem`, `removeCartItem`, `getCartStats` |
| `src/shipping.js`    | ShipStation integration: `fetchShippingRates`, session rate management                       |
| `src/payments.js`    | Square SDK payment processing, 8% tax calculation                                            |
| `src/orders.js`      | Order creation, customer data storage, order number generation                               |
| `src/newsletter.js`  | Newsletter: `storeSubscriber`, `deleteSubscriber`, `dispatchNewsletter`, `getSubscribers`    |
| `src/contact.js`     | Nodemailer email sending, stores in contacts collection                                      |
| `src/upload-back.js` | Multer config and file deletion                                                              |

---

## Workflow Rules

1. **ALWAYS PLAN.** Always use plan mode unless explicitly told not to. You must create a plan first or describe what you intend to do to the user. This is a critically important rule.

2. **ONE thing at a time.** Focus on ONE thing at a time. Do not start any follow-up tasks until I explicitly confirm the ONE thing is working correctly.

3. **Read-only means zero edits.** If the user says "don't change anything", "just review", "read-only", or similar — make NO code edits whatsoever. Violating this is a critical error.

4. **Use Edit, not Write, for existing files.** Write is for new files only. Always use targeted Edit on existing files.

5. **Must use official docs.** Whenever working with any third-party library or something similar, you MUST lookup the official documentation to ensure youre working with up-to-date informaiton. Use the DocExplorer subagent for efficient documentation lookup.

6. **Never use inline styles.** Always use the appropriate CSS file from the map above.

7. **All new event listeners go in `responsive.js`.** Use `data-label` attributes on elements and add corresponding `if` checks in the click/key/change/input handlers. The only exception is `collapse.js`.

8. **All new API calls go through `sendToBack()` or `sendToBackFile()`.** Never use raw `fetch()` directly in helper or form files.

9. **Form builders build DOM only.** No business logic, no API calls, no event listeners in `forms/` files. They return DOM elements with `data-label` attributes.

10. **Business logic lives in `helpers/`.** Form construction lives in `forms/`. Parameter construction lives in `util/params.js`. Never mix these concerns.

11. **Page detection uses element IDs.** Each HTML page has a unique root element ID (e.g., `admin-element`, `products-element`). `main.js` checks these to decide what to build. `responsive.js` checks these to decide what listeners to attach.

12. **Show/hide uses CSS classes, not inline display.** Use `hidden` class for general show/hide, `visible` class for modals, `active` class for loading overlays. The `.collapse-content.hidden` pattern uses `max-height: 0` for animation.

13. **New pages need:** an HTML file in `html/`, a CSS file in `public/css/`, a form builder in `forms/`, a root element ID, entries in `main.js` and `responsive.js`, and a route in `routes/router.js` + `controllers/display-controller.js`.

14. **Verify UI changes** When making UI/modal layout changes, always verify the fix visually makes sense by checking for: (1) conflicting CSS properties that could override the fix, (2) correct scroll container targeting, (3) z-index stacking context relative to modals. First attempts at CSS fixes frequently fail due to these issues.

15. **fuck .map** I dont like the .map method in js and prefer to see for loops instead. this is just a personal preference, please use for loops instead of .map

16. **Handle Interruptions Gracefully** When interrupted or session ends mid-task, always write remaining changes to a plan file at `.claude/plans/` so the next session can pick up without re-analysis.

---

## CSS / Styling

- **Verify font capabilities before setting properties.** Google Fonts like Indie Flower only support weight 400. Check font support before applying `font-weight`, `font-style`, etc.
- **Apply broad styling broadly.** When asked to change styling for "all" elements or make things "more prominent", apply changes across all relevant selectors — not just one. If scope is ambiguous, ask rather than under-applying.

## Data & Backend Conventions

- **New boolean fields default permissively.** For existing records missing a new flag, assume the permissive/open default (e.g., missing `canShip` = `true`, not `false`). Only restrict when the field is explicitly set to the restrictive value.

## Debugging

- **One hypothesis at a time.** Test methodically — read the error carefully, form one hypothesis, verify it, then move on. Do not cycle through speculative fixes without checking each one first.

## Development Philosophy

- **No frontend frameworks** — this is a deliberate choice. Do not introduce React/Vue/Angular.
- **Minimal dependencies** — prefer practical, direct solutions.
- **DOM manipulation** — use querySelector, addEventListener, createElement patterns matching existing code.
- **No build tools** — no webpack, no transpilation. Vanilla JS runs directly in browser.
- **Centralized Event handler** - use responsive.js to handle all events

---

## Common Mistakes

### Wrong file placement

- **Mistake:** Adding event listeners in form builders or helper files instead of `responsive.js`.
- **Fix:** Always add `data-label` to elements in form builders, then route in `responsive.js`.
- **Mistake:** Putting business logic (API calls, data processing) in `forms/` files.
- **Fix:** Forms build DOM only. Logic goes in `helpers/`. Params go in `util/params.js`.

### CSS specificity conflicts with `.status-select`

- **Mistake:** Trying to override `.status-select.status-yes` or `.status-select.status-no` colors with lower-specificity selectors.
- **Fix:** These use combined class selectors (`.status-select.status-yes`) with explicit `background-color`, `color`, and `border-color`. To override, match or exceed that specificity. The color state is toggled in `admin-run.js` via `runChangeStatusCard()` which adds/removes `status-yes`/`status-no` classes.

### Scrollbar hiding in modals

- **Mistake:** Using `-webkit-scrollbar { display: none }` or `overflow: hidden` on modal wrappers, which breaks scroll on some browsers or hides content.
- **Fix:** The modal system uses `scrollbar-width: none` on `.modal-wrapper` (Firefox) and relies on the wrapper's `overflow-y: auto` + `max-height: calc(100vh - 4rem)`. Don't add additional scrollbar-hiding rules on `.modal-overlay` or `.modal-content`.

### Popup z-index layering

- **Mistake:** Popups or dialogs appearing behind modals.
- **Fix:** Modal overlay is `z-index: 1000`. Confirm dialog is also `z-index: 1000`. Popup notifications are `z-index: 10` (they show on regular pages, not inside modals). Loading overlay is `z-index: 9999`. Respect this hierarchy.

### Forgetting to update `responsive.js` after adding new interactive elements

- **Mistake:** Creating a new button with a `data-label` but never routing it in `responsive.js`, so clicks do nothing.
- **Fix:** Every new `data-label` needs a corresponding `if` check in the appropriate handler in `responsive.js`.

### Admin modal state management

- **Mistake:** Not disabling form fields when no product/event is selected in edit mode, allowing edits to an empty form.
- **Fix:** Edit modals start with fields disabled. Selection via `changeAdminProductSelector`/`changeAdminEventSelector` populates and enables fields. Follow this existing pattern.

### Confirm dialog promise pattern

- **Mistake:** Not awaiting `displayConfirmDialog()` before proceeding with destructive actions.
- **Fix:** `displayConfirmDialog()` returns a Promise resolved by `closeConfirmDialog(true/false)` via `window.confirmDialogResolve`. Always `await` it: `const confirmed = await displayConfirmDialog("Delete?"); if (!confirmed) return;`

### Image upload data flow

- **Mistake:** Losing upload data between the upload step and form submission.
- **Fix:** `runUploadPic()` stores data on the upload button element: `uploadButton.uploadData = data`. On submit, retrieve it from the button. Don't store upload state anywhere else.

### New product/event fields silently dropped by backend whitelist

- **Mistake:** Adding a new field to `public/js/util/params.js` but forgetting to add it to the `whitelistFields()` call in `controllers/data-controller.js`. The field is sent by the frontend but stripped server-side before reaching MongoDB — no error, data just silently disappears.
- **Fix:** Any new field on a product or event must be added in TWO places:
  1. `public/js/util/params.js` — `buildNewProductParams()` and/or `getEditProductParams()`
  2. `controllers/data-controller.js` — the `whitelistFields()` array in `addNewProductControl` and/or `editProductControl`
- The whitelist is intentional security (mass-assignment protection). Keep it, but always update both places together.
