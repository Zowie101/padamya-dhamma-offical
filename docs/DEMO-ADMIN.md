# Demo order desk

Open `admin.html` on the **same origin and browser profile** used for checkout. For example, use `http://localhost:8002/admin.html` if checkout ran at `http://localhost:8002/`. `localhost`, `127.0.0.1`, a phone's LAN address and a tunnel domain have separate browser storage; they will not share orders.

## Use it

1. Complete a demo checkout, or click **Add sample orders**. Samples are optional and are not duplicated; existing orders are retained.
2. Search by order ID, customer name or email, or filter by stage.
3. Select an order. Review its pieces, quantities, totals, customer and delivery address.
4. Choose **Order Placed**, **Confirmed**, **Packed**, **Out for Delivery** or **Delivered**, then click **Update stage**. Selecting a stage does not save automatically.
5. Open **Customer view** to check the corresponding tracking page. An already-open tracking tab updates when the order changes.

Changes are explicitly marked as simulated. Each update records its previous stage, next stage and exact timestamp in `adminEvents`, with a snapshot of the prior timeline. Jumping forward fills intermediate demo stages at the update time. A backward correction trims future entries from the active timeline but preserves them in the change log snapshot. Correcting back before dispatch clears the simulated shipping date. No carrier, tracking number or tracking URL is invented.

The archive remains `sacredFormOrders_v1`. Cart, wishlist and checkout data are separate. A stale update is rejected when the expected stage differs from the latest saved stage; failed storage writes leave the stored order unchanged. Admin changes do not collect payment, submit an order, send messages, or notify a customer.

## Demo boundary

This is **not a secure admin system**. It has no authentication or backend. Anyone using this browser profile can view or change its local demo orders. `noindex` is only a crawler hint, not access control. Real administration requires authenticated, server-authorized writes and a database. Do not use this local workspace as a live order-management system.

## Checks

```sh
node --test tests/admin-orders.test.cjs tests/orders.test.cjs
node tools/check-paths.mjs
```

Browser check: open a sample order in the dashboard and in a second tracking tab, update its stage, and confirm the customer timeline changes without a reload. Test search, all stage filters, forward/backward changes, the change log, theme switching and a narrow mobile layout. Native AR is unrelated to this change.
