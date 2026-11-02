# Deploy Padamya Dhamma: Render + Supabase

The site runs as one Render Node web service: pages, API, sessions, orders, and Sage share one HTTPS origin. Supabase PostgreSQL stores the persistent data. Optional Supabase Storage holds new admin-uploaded product media. Existing bundled product photos and models remain in the repository.

Local SQLite development still works. Cloud startup refuses to run with a missing database connection, so it cannot silently store orders on Render's temporary disk. Nothing automatically copies local accounts or orders into Supabase. Keep `.data/` private and backed up; register a fresh cloud account, or arrange a separate reviewed migration if you need old records.

## 1. Supabase

1. Create a free project and save its database password privately. Choose Singapore if available.
2. Click **Connect → Direct / Connection string**. In the Method selector, select **Session pooler**, not Transaction pooler. Copy its URI, normally port `5432` on `pooler.supabase.com`. This avoids relying on an IPv6-only direct database endpoint.
3. Open the ignored local `.env.cloud` file. Put the URI on `DATABASE_URL=` and replace `[YOUR-PASSWORD]`. URL-encode special characters in the password. Never post this string or commit it.
4. From the project folder in PowerShell run:

```powershell
& "C:\Users\HONOR\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --env-file=.env.cloud server/check-cloud.mts
```

This creates the private `padamya` schema and seeds the six actual products without overwriting later catalogue changes. It prints a connection result, never the password. Authentication stays in the existing Node backend; Supabase Auth is not required. Do not add `padamya` to the Supabase Data API's exposed schemas. Its tables have RLS enabled with no anonymous policies.

SSL verification is always enabled. If certificate verification fails, download the project's root certificate from Supabase Database settings and place its PEM contents in `DATABASE_CA_CERT` (newlines may be written as `\n`). Do not disable TLS verification.

## 2. Put the project on GitHub

Use a **private repository**. Publish through Git or GitHub Desktop so `.gitignore` is respected; do not drag the entire folder into GitHub's upload page.

The ignore file excludes `.env`, `.env.cloud`, `.data`, `node_modules`, previews, videos, archives and tool caches. Keep these exclusions. The repository includes original 3D models, some around 45 MB; use Git/GitHub Desktop instead of browser uploads. No source asset needs to be deleted locally.

If using GitHub Desktop: **File → Add local repository** and select this folder. If it is not yet a repository, choose **create a repository here**, keeping the project folder itself as the repository root. Review the files, make the initial commit, then **Publish repository**, with **Keep this code private** enabled. `.env.cloud` and `.data` must not appear among committed files. No ZIP is needed.

## 3. Render

1. In Render choose **New → Blueprint** and connect the private repository. Authorize only that repository.
2. Render reads `render.yaml`. Confirm the service plan is **Free** and the region is Singapore.
3. When prompted for `DATABASE_URL`, enter the same Session pooler URI privately in Render's Environment settings.
4. Deploy. The blueprint uses Node 24.22.1, `npm ci --omit=dev`, `npm start`, and `/api/health`.
5. The backend automatically uses `RENDER_EXTERNAL_URL` as its exact HTTPS origin. For the provided Render URL, leave `PUBLIC_ORIGIN` unset. If adding a custom domain later, set `PUBLIC_ORIGIN` to that exact HTTPS origin and restart the service.
6. `/api/health` should return `ok: true` and `storage: "postgres"`. Test on the new HTTPS URL, not a local file or old Cloudflare address.

Manual Web Service setup works too: Node runtime, Free plan, `npm ci --omit=dev`, `npm start`, `HOST=0.0.0.0`, `DATABASE_PROVIDER=postgres`, `DATABASE_URL` (secret), `COOKIE_SECURE=true`, `ALLOW_DEMO_SEED=false`, and `SAGE_PROVIDER=demo`.

Render's free service can sleep; an idle visit may need time to start. Supabase free projects can pause after inactivity. These are demo-tier limits, not a guaranteed production uptime service.

## 4. Administrator

1. Register your own account on the deployed website. Do not use the Supabase or GitHub password for the store.
2. On your computer, from this project folder, run:

```powershell
& "C:\Users\HONOR\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --env-file=.env.cloud server/cloud-admin.mts
```

3. Enter the email of that registered store account. The private CLI promotes it and expires its old sessions; it does not ask for or change the password.
4. Sign in again on the website. Open Account → Order desk. A second phone/customer account must see only its own orders.

There is no public admin setup endpoint and no admin password in the repository.

## 5. Optional new product uploads

Bundled catalogue images/models work without this step. For new uploads:

1. Supabase → Storage → create a **public** bucket named `product-media`, used only for public product artwork.
2. Add `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET=product-media`, and the private legacy `service_role` key as `SUPABASE_SERVICE_ROLE_KEY` to Render's Environment settings. The key belongs only on the server.
3. Restart. Only authenticated administrators can upload; signatures and an 8 MB maximum are validated. Without configuration, the API refuses new uploads instead of writing them to temporary disk.

Product media is served through the backend's same-origin `/media/` route so room-photo screenshots continue working. Customer room photos remain on their devices and are not uploaded to this bucket.

## 6. Release checks

- Register, sign in/out, save a wishlist, add a piece, check out, print a receipt, and reopen order history.
- Sign in as the administrator and update the stage. Verify the customer sees the update and a different account cannot see that order.
- Restart/redeploy Render and verify the cloud order still exists.
- Check all six product models, shrine styles, uploads and photo screenshot exports; test AR separately on compatible hardware over HTTPS.
- Sage remains guided/demo mode unless you deliberately add a supported provider's server-side key later.

Before publication: `node --run test` and `node tools/check-paths.mjs`. PostgreSQL integration tests use a local PostgreSQL WASM engine, not your cloud project. A successful local test does not confirm your actual Supabase connection; run the private connection check and deployed smoke tests as well.

References: [Supabase connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres), [Render Node deployment](https://render.com/docs/deploy-node-express-app), [Render free limits](https://render.com/docs/free).
