# Order tracking — local demonstration

## Run

Serve the existing folder over HTTP, for example `python -m http.server 8002`, then open `http://localhost:8002/`. No build step, new package, carrier account or network API is required.

Use **Track Order** in the navigation to see all orders saved in this browser immediately. Select a history row to open its timeline and details without retyping credentials. Filters apply to all local orders, even when different checkout emails were used. **Track This Order** on a receipt opens the matching local order directly. The compact toolbar places **My order history** on the left, sliding status filters in the middle and an **ID-only search** on the right. An incorrect ID clears the open details but leaves local history available. No email is placed in a URL. This is local device history, not a signed-in account; anyone using the same browser profile can view its saved orders.

## Checkout and receipts

Checkout saves `sacredFormOrders_v1` independently of `sacredFormCart_v1`, with a unique seven-digit reference such as `SF-2774814` (with collision checking), customer details, product snapshots (name, price, image, height, quantity), subtotal, total, initial `placed` status and timestamped history. Product snapshots preserve historical prices. Delivery fees and estimates are **unconfirmed**, not invented; the current total excludes an unconfirmed delivery fee.

The bag clears only after the order archive saves successfully. On storage failure, the form reports the problem and keeps the bag. `sacredFormLastOrder` remains a compatibility cache; older last-order data can still be read and is included in the archive at the next write. Orders never progress automatically.

Both tracking and original receipt pages offer **Print receipt**. The browser print menu allows paper printing or **Save as PDF**. Print styles remove navigation and controls and use white paper regardless of the current theme. The tracking printout includes the delivery address. Original archived receipts opened from tracking require selection from local history or the local ID lookup in that tab first; an order ID in a receipt URL alone does not unlock them.

## Explicit developer demo

Open `http://localhost:8002/track-order.html?demo=1` (or `127.0.0.1`). Expand **Developer demo controls**, then click **Create sample orders**. This opt-in action creates three clearly labelled samples, without modifying the shopping bag or duplicating existing samples:

| Order ID | Email | Initial stage |
| --- | --- | --- |
| SF-DEMO-1001 | demo@sacredform.example | Confirmed |
| SF-DEMO-1002 | demo@sacredform.example | Out for Delivery |
| SF-DEMO-1003 | demo@sacredform.example | Delivered |

The sample orders appear immediately in local history; select one to view its timeline. Test **All Orders**, **Processing**, **Out for Delivery**, and **Delivered**. **Simulate next stage** advances the selected order one step and records the actual action timestamp with `simulated: true`. It can also explicitly simulate an ordinary local checkout; that order is then labelled simulated. There are no timers that dispatch or deliver orders. Sample fees and estimates are demonstration data. No sample has a carrier number or carrier URL.

Demo controls are hidden on normal URLs and non-loopback hosts. This is a developer convenience, **not a security boundary**: anyone with browser developer tools can change local data. Remove or replace these controls before a production launch.

## Files and integration boundary

- `assets/js/orders.js`: repository (`create`, `lookup`, `lookupLocal`, `history`, `localHistory`, `advance`, `seedDemo`, `latest`), validation, migration and status definitions. CommonJS factory export permits dependency-free unit tests.
- `assets/js/tracking.js`: lookup, five-stage timeline, filtered history, copy ID, original receipt links, print, and explicit developer simulation.
- `assets/css/tracking.css`: responsive timeline (five columns desktop/tablet, vertical mobile), theme variables, reduced motion and print layouts.
- `track-order.html`: shared storefront shell and tracking form.
- `assets/js/app.js`: existing checkout and receipt integration.
- `assets/locales/my.json`: Burmese tracking labels; customer-entered data is not translated.

A carrier link appears only if an order contains a configured HTTPS `delivery.trackingUrl`, a `delivery.trackingNumber`, and is not simulated. The repository also accepts `delivery.company`, `delivery.shippedAt` and `delivery.estimatedAt`. These fields are not generated for ordinary orders. Configure genuine carrier data in a future backend; no carrier API is connected now.

For production, replace repository calls with authenticated backend endpoints, persist orders server-side, authorize every order/history/receipt request, verify webhook signatures, enforce status transitions and idempotent checkout, and obtain delivery fees and dates from actual fulfilment data. Local email matching is **not secure authentication**. Orders and history are available only in the same browser/profile/origin, can be modified or cleared by its user, and do not synchronize across devices. Never deploy this demonstration as a secure customer account system. Payment is not collected here.

Support contact and notifications are not connected: no real support destination was supplied and no outbound emails/SMS are sent. Cancellation requests require a seller workflow and are not simulated as completed cancellations.

## Validation

Run `node --test tests/orders.test.cjs` for persistence, immutable price snapshots, unique IDs, incorrect-email rejection, history isolation, filters, corrupt/legacy data, explicit progression, storage failure and the actual checkout handler's cart-clear/navigation behavior.

Browser checks: complete checkout with fictional data; follow **Track This Order** and verify ID prefill; submit an incorrect email, then the correct one; select history orders and filters; simulate a stage; open an archived receipt; check print preview or Save as PDF; resize to mobile; switch English/Burmese and light/dark; verify the console and existing shop, bag, wishlist and 3D pages. Preview screenshots are saved in `preview/`.

## Simplified timeline and legacy compatibility

The five stages are Order Placed, Confirmed, Packed, Out for Delivery, Delivered. Stage descriptions and repeated upcoming-state text are removed. The receipt, tick, package, delivery and home SVGs come from `assets/icons/`. Older preparing/inspection statuses map to Confirmed; older Shipped maps to Packed until explicitly advanced to Out for Delivery. Original detailed events are retained as `legacyHistory`. Old references are kept valid; only new orders receive the shorter IDs. The frontend ID search searches local device data only; it is not a public server lookup or authentication system. The repository retains email-checked lookup for compatibility with archived receipt links.
# Demo administration

Use `admin.html` to manage the local order archive. Stage changes are explicit, recorded with timestamps and reflected in open customer tracking tabs. See [the demo order desk guide](DEMO-ADMIN.md) for usage and limitations. This is a browser-local demonstration with no login, server or real shipping connection.

