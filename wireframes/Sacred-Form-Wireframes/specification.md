# Sacred Form — complete ecommerce wireframes

44 editable SVG artboards: 22 screen types at desktop (1440 px) and mobile (390 px) widths.

## Open and explore

Open `index.html` in a browser. Choose any screen in the sidebar and switch between desktop and mobile. Primary links connect the shopping journey. The preview works offline and needs no installation.

This is a structural prototype: upload, carousel, quantity and form controls are represented visually. Clicking **Choose a photo** opens the uploaded-photo state; it does not access your files. Primary buttons navigate between wireframes. This preview does not collect data or change the working store.

## Import into Figma

1. Unzip the bundle.
2. Drag the desired files from `screens/` onto a Figma design canvas, or use **File → Place image** for individual SVGs.
3. Keep each screen at its native width (1440 or 390). Rename or group the imported screen with its filename.
4. Text, shapes and image placeholders are vector content. Figma may substitute fonts; the files use Arial. SVG imports are not native Figma Auto Layout components or a connected Figma prototype. Use the HTML viewer to review the linked flow, then connect frames in Figma if desired.

## Visual direction

Based on the seven supplied grayscale references: large headings, simple image blocks, alternating gray sections, rounded cards, obvious primary actions, generous gutters and consistent footer structure. All page content and shopping actions are adapted to Sacred Form. Dental copy and clinic workflows have not been copied.

Images are intentionally gray placeholders. They identify content roles rather than prescribe final photographs. The four-photo homepage composition, four category cards, collection banner, 3D gallery, shrine scene, wishlist and comparison remain recognisable from the current store.

## Screen inventory

| Screen | Purpose and key content |
| --- | --- |
| Home | Four-photo hero, shop action, four category cards with hearts, full-width collection banner, story and footer |
| Shop all | Search, category filters, dual-handle budget on one track, sort, six products |
| Product detail | Main 3D/photo area, thumbnails, model controls, details, quantity, bag, wishlist and shrine actions |
| Shrine preview | Undistorted scene, grounded statue, portrait carousel, height selection, reset below preview, product action |
| Wishlist | Clearly bounded cards, image focus, saved state, bag and comparison actions |
| Compare · upload | Photo upload, two saved-piece images, optional clearance, preferred feeling, disabled comparison action |
| Compare · photo added | Shrine photo replaces upload prompt; compact change/remove actions; enabled comparison action |
| Comparison · stronger match | Winner-first hierarchy, large product images, match scores, chart positions, reason and product actions |
| Shopping bag | Item list, quantity, removal, subtotal, delivery note and checkout action |
| Checkout request | Contact and delivery fields, optional note, order summary and local request action |
| Request saved | Local reference, selected pieces, subtotal and continue-shopping action |
| Our story | Story image, brand statement, three values and collection link |
| Shop · no matches | Reset filters recovery |
| Wishlist · empty | Heart explanation and collection recovery |
| Bag · empty | Collection recovery |
| Compare · needs two pieces | Minimum-selection requirement and discovery action |
| Compare · upload error | Invalid file feedback and supported-file guidance |
| Checkout · validation | Required fields and inline errors |
| Comparison · close match | Neutral treatment when scores are close |
| Comparison · neither fits | Neither recommended when listed heights exceed clearance |
| Shared components | Actions, fields, selected filter, validation and product card |
| Shopping flow | Ten-step discovery-to-request navigation map |

## Interaction handoff

- Navigation: Shop all, Shrine preview, Our story, Wishlist and Bag are available across desktop screens. On mobile, the working site's menu should expose the same routes; the wireframe shows a menu affordance.
- Hearts toggle persistent saved status. Removing the last piece shows the empty wishlist.
- Shop filters combine search, category and budget; sort orders the remaining set. The entire control block stays below the header while browsing. Filters use a solid selected fill without text scrambling.
- Product quantity changes the amount added to the bag. The main product view uses proportionate imagery. Mobile moves details below the gallery rather than compressing them.
- Shrine selection wraps through six products. Side images are visible with a subtle blur in the finished interface. Height changes the scale; reset restores the view. Preserve the scene's composition as width changes.
- Wishlist comparison links preselect the clicked piece. Require two different saved pieces. Changes to photo, pieces or preferences invalidate prior results.
- Photo upload accepts JPG, PNG, WebP or AVIF up to 12 MB; show a recoverable error otherwise. After upload, replace the upload square with the photo and compact actions.
- Results put the stronger piece first, with an explicit label and stronger grayscale contrast. Animate score/chart entry in the finished interface and respect reduced-motion preferences. Close scores and inadequate height clearance have dedicated states.
- The comparison is the current local rule-based aid: overall image palette/brightness plus product details, optional clearance and preference. It is not semantic AI analysis and cannot infer accurate physical measurements from a photo. Example scores in these boards are illustrative, not computed recommendations.
- Cart quantity and removal update totals. An empty bag disables progression to checkout.
- Checkout retains the existing prototype scope: saves a request in this browser; no payment collection or backend order submission. Confirm delivery separately. Required contact/delivery fields receive inline feedback.

## Responsive layout

Desktop uses side-by-side image and decision panels. Mobile uses a single column and full-width primary actions, allowing natural scrolling. Product images and the shrine preview keep meaningful proportions; they are not vertically squeezed to force every control into one mobile viewport. Final production sizing should account for the actual header and browser height.

## Contents and checks

- `index.html`: self-contained linked review viewer.
- `screens/`: 44 editable SVG artboards.
- `manifest.json`: screen names, device, native dimensions and paths.
- `overview.png`: desktop page overview.
- `build.py` / `render.cjs`: repeatable source and preview generation.

All artboards were parsed as valid SVG, their rectangle boundaries checked against the canvas, and link destinations checked against the screen inventory. Representative desktop and mobile screens were rendered and visually reviewed. This deliverable is separate from the working website; no storefront HTML, styles, scripts or images were edited.
