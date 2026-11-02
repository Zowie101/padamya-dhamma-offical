# Padamya Dhamma local backend

## Run

Use Node.js 24.12 or newer within the 24.x release line. From the project root:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

If dependencies are already installed and npm is unavailable, use `node --run start`. Open http://127.0.0.1:8010. Keep the terminal running. The previous static preview port does not run these backend features.

Create your own administrator in a second private terminal:

```powershell
node --run admin
```

Enter your own email and a password of at least 12 characters. Input is visible in that private terminal. This command creates or updates that administrator and invalidates their old sessions. No default administrator or password is shipped. Sign in at `/account.html?return=admin.html` and open the order desk. Customers can register/sign in through `/account.html`.

## What is implemented

- Same-origin Node HTTP server and persistent SQLite database, with Zod request validation.
- Guest sessions and email/password accounts. Passwords use salted scrypt; opaque session cookies are HttpOnly and SameSite=Lax. Mutations require a session CSRF token. Rate limits cover authentication, checkout, uploads and Sage.
- Account-owned bags, wishlists and orders. Signing in merges only the current guest session, including its orders. Other accounts cannot retrieve an order by guessing its ID or email.
- Atomic checkout: server-calculated MMK prices, inventory checks, stable retry keys, order snapshots, short unique SF references and bag clearing only after saving succeeds.
- Administrator-only stage changes, stale-update protection, corrections and audit history. Stages never advance automatically.
- Administrator catalogue controls for price, recorded stock and availability. Blank stock means **not recorded**, not unlimited verified inventory. Current catalogue assets are preserved.
- Admin-only image/GLB upload with type/signature and size checks (8 MB). Uploaded files have generated URLs. The upload does not automatically replace any product asset; only publish assets intended for customers.
- Sage endpoint and shared catalogue rules; see [Sage setup](SAGE.md).

The original static frontend demo remains available with a static server. It uses browser storage and its existing demo order desk. Under the Node server, the server repository replaces that demo adapter and admin privileges are enforced. Never host the static demo as a real order-management service.

## Persistence and privacy

`DATABASE_PATH` defaults to `.data/sacred-form.sqlite`; uploaded catalogue media is in `.data/media`. Keep the whole `.data` directory private. Stop the server before making a simple file-copy backup of it. Do not commit or distribute it. The ZIP excludes it and all real environment files. Product seed data is inserted only when missing; restarting does not overwrite admin edits.

The existing local bag/wishlist is imported once per server profile. Existing browser-only order histories are retained in browser storage but are not silently trusted as server orders. Guest orders belong to the session cookie; create/sign in to an account to retain access across devices when this server is hosted.

Order tracking uses the signed-in/guest owner session. The order ID is a search value, not authentication. Orders and addresses are never exposed through Sage tools. Admin access can view all server orders. Registration presently has no email verification, password recovery, MFA or account deletion interface.

## Phone / HTTPS

For local desktop testing use the address above. For another device, use a trusted HTTPS tunnel or a proper HTTPS host and set `PUBLIC_ORIGIN` to the exact public HTTPS origin (no trailing slash), then restart. `COOKIE_SECURE=auto` sets Secure cookies for that configured HTTPS origin. Never disable origin/CSRF checks to make a tunnel work. Camera/WebXR still require compatible hardware and HTTPS. Room photos remain processed on the device; catalogue admin uploads are a separate feature.

`HOST=127.0.0.1` is intentionally local by default. Binding a LAN interface or creating a public tunnel exposes this running development service; choose strong administrator credentials first.

## Local scope and cloud connection

This is a working local backend, not a deployed production service. No Supabase, carrier API, payment processor, notification service or email provider is connected. Orders remain unpaid requests; shipping details and fees are not invented. Admin sample orders are opt-in and labelled demo. Set `ALLOW_DEMO_SEED=false` to disable sample seeding.

For cloud deployment, use a persistent Node host with a private disk initially, or implement a PostgreSQL/Supabase repository and managed auth/storage next. Do not deploy this SQLite process unchanged to stateless/serverless functions. Production work also includes managed backups, account recovery/verification, HTTPS/proxy configuration and distributed rate limiting. These are separate connection/deployment stages.

## Useful endpoints

- Public: GET `/api/health`, GET `/api/catalogue`.
- Session: GET `/api/bootstrap`, POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`.
- Owner: GET/PUT `/api/cart`, `/api/wishlist`; POST `/api/bag/import`; GET/POST `/api/orders`; GET `/api/orders/:ref`.
- Admin: GET `/api/admin/products`; PATCH `/api/admin/products/:id`; PATCH `/api/admin/orders/:ref/stage`; POST `/api/admin/orders/seed`, `/api/admin/media`.
- Assistant: POST `/api/sage`.

All mutation endpoints use JSON and `X-CSRF-Token` from bootstrap, with same-origin credentials. Static files use an allowlist; server source, keys, database and maintenance scripts are not served.

## Verification

```powershell
node --run test
node --run check:paths
```

Tests cover checkout ownership, tampered prices, retries, inventory atomicity, account merging, CSRF, role boundaries, stage corrections, asset range loading, guided assistant behaviour and mocked LLM tool loops. Existing AR/camera/gesture/order/transition tests are retained. Browser checks covered actual checkout/receipt, bag clearing, Sage recommendation add-to-bag, bag totals, comparison, tracking help and a 390px mobile frame. Live provider calls and real device AR were not re-tested as part of the backend work.

## Checkout sign-in requirement

Guests can browse and keep a bag or wishlist. Continuing to checkout opens a sign-in/create-account dialog; successful authentication returns to checkout and preserves the current bag. Direct checkout-page visits are gated too. The order creation API rejects guest sessions with HTTP 401 before saving an order or clearing the bag. Existing orders are preserved.
