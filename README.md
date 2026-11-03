# Padamya Dhamma — Objects for Stillness

A responsive, multi-page Buddha statue storefront built with HTML, CSS, and vanilla JavaScript. The existing Padamya Dhamma gallery design and product catalogue were retained and updated for an integrated 3D product gallery.

## Backend and Sage — local first

A persistent local backend and Sage shopping assistant are now included. Start with Node.js 24.x: `npm ci`, copy `.env.example` to `.env`, then `npm start` (or `node --run start` when dependencies are installed). Open **http://127.0.0.1:8010**.

See [backend setup and admin access](docs/BACKEND.md) and [Sage modes and private API configuration](docs/SAGE.md). Sage works in labelled guided mode without a key; Gemini and OpenAI adapters are ready for later connection. Render + Supabase deployment support is included; it is not connected until you supply the private configuration. No payment, carrier or email service is connected.

## Cloud hosting

See [Render + Supabase deployment](docs/DEPLOYMENT.md). The backend supports persistent PostgreSQL on Supabase while retaining local SQLite development. `render.yaml` configures the free Render service. Never upload `.env.cloud` or `.data/`.

## Project folders

Accessibility settings are available under account/mobile menu Preferences. See [accessibility features and keyboard testing](docs/ACCESSIBILITY.md).

```text
├── *.html                 Storefront pages; existing URLs stay unchanged
├── assets/
│   ├── css/               Shared styles and page styles
│   ├── js/                Storefront scripts and Room Studio modules
│   ├── products/          buddha_1 … buddha_6: original photos, cutouts and models
│   ├── images/            Banners, room backgrounds and optimized previews
│   ├── models/            Optimized GLB files and previous AR versions
│   ├── fonts/             Myanmar typography
│   ├── icons/             Supplied SVG icons
│   ├── locales/           Burmese translations
│   └── vendor/            Local Three.js and model-viewer libraries
├── server/                Local HTTP API, SQLite repository and AI adapters
├── .env.example           Private configuration template; no keys
├── docs/                  Feature guides and technical notes
├── tests/                 Automated checks and browser QA pages
├── tools/                 Asset builders and maintenance scripts
├── preview/               Saved screenshots and test previews
└── wireframes/            Separate wireframe project and exports
```

Serve the **project root**, not the `assets` directory. All storefront pages remain at their existing addresses. Cart, wishlist, language and theme storage keys are unchanged. Old order image paths are resolved when reading saved orders. A pre-migration text backup and move manifest are kept under `tools/backups/`.

Run `node tools/check-paths.mjs` to validate local asset references. Run all automated checks with `node --run test`.

## Pages

- `account.html` — local server sign-in and registration
- `admin.html` — server-protected order and catalogue desk when using Node; static demo order dashboard with stage controls and a change log (see [demo admin guide](docs/DEMO-ADMIN.md))

- `index.html` — editorial/gallery-style landing page
- `shop.html` — product collection with search, category filters, and sorting
- `product.html?id=golden-presence` — product details, image thumbnails, and the integrated 3D Buddha viewer
- `shrine.html` — adjustable visual shrine size preview
- `wishlist.html` — saved pieces with hearts, removal, and add-to-bag controls
- `cart.html` — persistent shopping bag and order summary
- `checkout.html` — customer details and local order request form
- `order-success.html` — last order request summary
- `track-order.html` — local order history, ID search and five-stage timeline (see [order tracking setup and testing](docs/ORDER-TRACKING.md))
- `about.html` — brand story and collection approach

## Account panel

The header keeps Shop all, Shrine preview and Our story centred. On desktop, the account icon beside Wishlist and Bag opens a sliding side panel with account information, sign-in/registration, order history, and the original language/theme switches. On mobile, the right-side controls are Wishlist, Bag and Menu; Menu opens one combined navigation/account drawer capped at 50% of the viewport width. Administrators also receive an Order desk link. The panel supports outside-click/Escape closing, keyboard focus containment, reduced motion and mobile layouts.

## Light and dark mode

Use the sun/moon button in the header on any page. The first visit follows the device's colour preference; choosing a mode stores it under `sacredFormTheme_v1` and keeps it across pages and visits. Tabs synchronise when the saved preference changes. If browser storage is unavailable, switching still works for the current page.

`assets/js/theme.js` runs in the head before styles to avoid a flash of the opposite theme. `assets/css/theme.css` supplies dark surfaces and contrast adjustments for the catalogue, wishlist, comparison, product details, shrine controls, cart and checkout. Photography and shrine material finishes retain their actual colours.

## Local preview

Shared interaction states live in `assets/css/interactions.css`, loaded after the base and theme styles on all storefront pages. Navigation has accent underlines; header icons have a soft highlight; action, quantity, shrine, upload, reset and remove controls have role-appropriate hover/focus feedback. Dark and light states preserve readable text. Reduced-motion preferences disable the added movement. Random-text animation remains limited to `.hero .cta` and `.split-cta`.

1. Open this folder in Visual Studio Code.
2. Install/use the Live Server extension.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Open the shop and product detail pages to test the catalogue and 3D preview.

Use a local web server rather than opening the pages directly as `file://` URLs. The 3D viewer libraries, photographs and GLB models are loaded locally from `assets/`. External Google Fonts may still require an internet connection.

## 3D model

### Custom shrine preview

On `shrine.html`, choose Golden arch, Warm oak or Quiet stone. Enter a whole-number shelf width (40–300 cm) and clear height above the statue seat (30–250 cm). The preview fits both measurements with one scale, preserving their aspect ratio, and draws width and height measurement bars. Selecting a different statue height updates its relative size. An inline warning appears when the statue exceeds the available height or has less than 5 cm of headroom.

Design and dimensions are saved in this browser under `sacredFormShrine_v1`; Reset view changes only the camera angle. These are approximate visual proportions using the selected model and viewer framing, not a guarantee of width/depth fit. Pieces without an assigned model use the original sample. Invalid input keeps the last valid preview and displays guidance. The scene recalculates on resizing rather than stretching. Product-page shrine links pass the selected piece in the `piece` query parameter.

The product gallery uses Google's `<model-viewer>` component. The first thumbnail selects the piece's interactive 3D model; the other thumbnails show Front, Side and Back photographs when supplied. Drag to rotate, scroll/pinch to zoom, and use the controls to zoom, pause/resume rotation, or reset the camera. The same product assets appear in shop cards, related pieces, wishlist, comparison, cart and shrine selection.

The six uploaded asset sets are assigned by appearance:

| Piece | Asset folder | Photos | Model |
| --- | --- | --- | --- |
| Golden Presence | `buddha_2` | `(01)` front, `(02)` side, `(03)` back | `buddha_2 3d model.glb` |
| Quiet Meditation | `buddha_1` | `(01)` front, `(02)` side, `(03)` back | `buddha_1 3d model.glb` |
| Gentle Blessing | `buddha_3` | `(01)` front, `(02)` side, `(03)` back | `buddha_3 3d model.glb` |
| Earth Touching | `buddha_4` | `(01)` front, `(02)` side, `(03)` back | `buddha_4 3d model.glb` |
| Temple Gold | `buddha_5` | `(01)` front, `(02)` side, `(03)` back | `buddha_5 3d model.glb` |
| Lotus Stillness | `buddha_6` | `(01)` front, `(02)` side, `(03)` back | `buddha_6 3d model.glb` |

The GLB files are approximately 35–43 MB each; only the currently selected model is requested. A product photo appears as a poster while its model loads. All six pieces use their own model. The original `buddha statue 3d model.glb` remains a fallback for future products without an assigned model. Change the `image`, `images`, `imageLabels`, `assetSet` and `model` fields in `PRODUCTS` to remap assets. Original files are retained in their folders.

The eighteen supplied product photos also have ` (01)-transparent.png`, ` (02)-transparent.png` and ` (03)-transparent.png` cutouts in each `buddha_1` through `buddha_6` folder. The catalogue uses these alpha PNGs throughout; the original JPEGs and 3D models are retained. Created with the built-in image editing tool using background extraction: remove the white background and floor shadow, preserve the statue, base, pose, camera angle, proportions, colors and details, and output a transparent PNG with clean edges and no halos. No comparison logic was changed.

Save website preview screenshots in the `preview/` folder, rather than the project root. Product cutouts stay beside their originals in the corresponding Buddha asset folder.

Shrine grounding measures the rendered model's opaque bounds using the model viewer's PNG capture API, rather than a shared percentage offset. It normalizes the chosen statue height and aligns the visible bottom with the pedestal after loading, resizing, rotating or resetting; size/style changes reuse that alignment. Floor shadows are disabled during measurement; the stage supplies a contact shadow at the seat. The 72 desktop combinations (six pieces × four heights × three styles) are recorded in `preview/shrine-grounding-checks.json`.

Size buttons reuse that framing: the WebGL canvas stays at a fixed 32 cm reference size and its wrapper scales from the pedestal over 420 ms. This avoids camera reframing and repeated pixel captures during size changes. Rapid clicks retarget the CSS transition; reduced-motion mode applies the final size immediately. Grounding still recalibrates for a new model, camera rotation/reset or viewport/dimension changes.

`assets/css/shrine-viewer.css` supplies the scale, animation and grounding transforms used by `initShrine`. Keep its stylesheet link after the shared styles in `shrine.html`; the size buttons require these rules to display the selected scale.

## Cart and checkout

The cart is stored in `localStorage` under `sacredFormCart_v1`. It persists in the same browser profile but does not synchronize across devices.

Checkout creates a local order request saved as `sacredFormLastOrder`, clears the cart, and navigates to `order-success.html`. This is a front-end demonstration only: it does not submit an order to a server, send notifications, manage inventory, or collect/process payments. Connect a secure backend and a suitable payment/order workflow before using this site for live sales. Do not collect payment card details directly in this static site.

## Product data and imagery

Edit the `PRODUCTS` array near the top of `assets/js/app.js`. Product images now use local files, including the three uploaded asset sets above. Existing IDs, prices, dimensions and categories are retained. Catalogue names, materials, prices and measurements remain prototype listings; verify them against actual inventory before publishing.

## Wishlist

Use the heart on a product card or “Save to wishlist” on a product page. The header heart opens the wishlist and shows its item count. Saved pieces can be removed or added to the bag. The wishlist is stored in localStorage under sacredFormWishlist_v1 and stays in the same browser; it does not sync across devices or accounts.

## Photo comparison

On mobile layouts (up to 900 px), **Take a photo** opens the phone's native capture picker with a rear-camera preference. The captured image follows the same local preview, size/type validation and comparison as a file upload. **Retake photo** replaces it; cancelling leaves the current preview and result intact. The original upload and Change photo controls still allow library selection. Camera capture depends on the phone/browser; unsupported devices may show a file picker instead. Test the native capture flow on an actual phone, not just a resized desktop browser.

Save at least two pieces, then choose Add to compare on a saved piece. The separate compare.html page opens with that piece selected. Select two favourites and add a JPG, PNG, WebP or AVIF photo (up to 12 MB). An optional clear shelf height adds a vertical-clearance check; a style preference adds a finish preference.

assets/js/comparison.js runs entirely in the browser. It reads whole-image brightness, average red/blue balance and saturation, and scores the listed product heights and finishes. The report shows each criterion, explains the weights and treats near-equal scores as a close call. Products taller than the entered height are excluded from the recommendation. Uploaded photos and analysis are not sent to a service or stored; choosing another photo or leaving the page clears the in-memory photo state.

This is a local rule-based comparison, not an AI vision integration. It does not identify a shrine, isolate a shelf, estimate physical measurements from pixels, or verify product photographs and finishes. Wishlist and catalogue data are prototype data; verify product details before using this for live sales.

The comparison workspace is on compare.html. Links from the wishlist pass the selected product ID in the piece query parameter; the second dropdown lists the other saved pieces. At least two saved pieces are required. The comparison page links back to wishlist.html.

## View in Your Room

3D views use shared optimized assets and lightweight posters. See [3D performance and rebuild instructions](docs/PERFORMANCE.md).

Every product now opens Room Studio with its actual statue selected. It includes local photo placement, manual live-camera overlay, and real GLB/WebXR surface placement on compatible devices. See [Room Studio setup, capabilities and testing](docs/ROOM-STUDIO.md) for instructions, privacy and hardware requirements. No ZIP is needed.

iPhone/iPad Safari also has an Apple AR Quick Look route: View in Your Room → Live AR camera → Open iPhone AR. Open the HTTPS preview link directly in Safari. The selected model is converted to USDZ locally before the native AR link appears.

# Languages

The header includes an English / မြန်မာ toggle with a remembered preference. See [LANGUAGES.md](docs/LANGUAGES.md) for translation editing and testing.


## Page transitions

Every storefront page includes `assets/css/page-motion.css` and `assets/js/page-motion.js`. Cross-document View Transitions provide a 140 ms fade out and a 340 ms fade in with 6 px of upward motion; the navigation bar stays visually steady. Browsers without cross-document support use the same entry motion and a short delayed navigation for ordinary internal links. `SacredPageMotion.navigate(url)` also handles checkout and Room Studio entry. Hash links, external links, downloads, new tabs, cancelled dialog links and modified clicks retain native behavior. Back/forward restores clear any outgoing state. Reduced-motion settings disable the effect and printing never captures a faded page.

Use `data-no-page-transition` on a special link to opt out of the fallback. Test the navigation safeguards with `node --test tests/page-motion.test.cjs`.

AI shrine-photo comparison setup, privacy and testing: [AI-COMPARISON.md](docs/AI-COMPARISON.md).

## Saved delivery details

Signed-in customers can leave “Save delivery details for my next order” checked at checkout. Only a successful order saves or updates their name, phone, email, address, city and country. Order notes are never reused. Future checkouts prefill those details, including on another device signed into the same account. Editing a field while defaults load takes priority over the saved value.

The Account page includes an editable Delivery details form. Customers can save an address before their first order and update it any time; existing order snapshots remain unchanged. Checkout no longer shows a forget action. Unchecking the save option does not overwrite an existing default. Private defaults are stored in `saved_delivery` (SQLite) or `padamya.saved_delivery` (PostgreSQL), created automatically at server startup. GET/PUT/DELETE `/api/account/delivery` require a signed-in session; PUT and DELETE also require CSRF validation. PUT validates the same delivery fields as checkout and strips order notes and supplied owner IDs. No delivery details are stored in browser localStorage or included in public bootstrap data.

Test with two accounts: complete a checkout with saving enabled, return to checkout and verify prefill, switch accounts and verify separation, then edit the address from Account and verify future checkout changes while past orders remain. Automated coverage exercises SQLite, PostgreSQL persistence, idempotent retries, failed checkout, consent, authentication and CSRF protections.

### Named address book

Account → Delivery details supports up to 10 named addresses (Home, Work, or a custom label). Click a card to edit, use “Use as default” to choose the address prefilled at checkout, or delete an address after confirmation. Deleting the default selects the first remaining address; deleting the last leaves checkout without a saved default. Past orders retain their original delivery snapshots.

An existing saved delivery address is read as a Home entry without changing its details; the version-2 address-book structure is saved on the next edit. Checkout's save option updates the selected default's delivery fields while preserving its label and the other addresses. Account name and signed-in email are displayed separately from address recipient details. Signing out requires confirmation.

Authenticated GET/POST `/api/account/addresses`, PUT/DELETE `/api/account/addresses/:id` and PATCH `/api/account/addresses/:id/default` always derive ownership from the session; all mutations require CSRF. SQLite and PostgreSQL address-book edits are transactional. Legacy `/api/account/delivery` still returns only the current default for existing checkout clients.
