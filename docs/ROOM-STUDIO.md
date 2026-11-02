# Padamya Dhamma Room Studio

Open any product and choose **View in Your Room**. This addition uses the existing catalogue, six transparent product cutouts, six actual GLB models, theme and shopping bag. No build step or backend is required.

## Run locally

Serve this project folder using VS Code Live Server, or `python -m http.server 8002 --bind 0.0.0.0`. Visit `http://localhost:8002/product.html?id=golden-presence`, or `http://localhost:8002/room.html?piece=golden-presence`.

Opening HTML through file:// does not support module loading. On another device, the ordinary LAN HTTP address supports photo placement but generally cannot request camera or immersive AR. For phone camera/AR tests, serve through a trusted HTTPS origin. Do not bypass browser certificate warnings. Localhost development is treated as a secure context, but does not make unsupported hardware compatible.

## Three clearly labelled modes

| Mode | Working controls | Requirements and limits |
| --- | --- | --- |
| Room photo | Upload, drag, corner resize handle, size/rotation sliders, change statue, up to eight placements, individual removal, undo, reset, suggested positions, backgrounds, PNG export and native file sharing where available | Ordinary modern canvas/module browser. Cutouts are 2D, not real surface detection or physical room measurement. |
| Camera overlay | Live rear-camera preference, movable/resizable/rotatable cutouts, multiple placements, PNG capture | HTTPS/localhost, getUserMedia and camera permission. Manual 2D overlay with no world tracking or surface detection. |
| Surface AR | Actual selected GLB, horizontal hit-test marker, tap/Place, Move statue, size, rotation, remove/reposition, reset, change product and existing Add to bag | Compatible device/browser providing immersive-ar, hit-test and dom-overlay, a secure context, WebGL and camera/AR permission. One tracked statue at a time. |

Surface AR starts only after an explicit user action. A feature probe checks immersive support; the session request validates the required hit-test and overlay features. Unsupported or denied sessions provide a photo/camera fallback. The code does not claim that a manual camera overlay detects surfaces.

Dedicated mobile GLBs are loaded lazily from assets/models/ar (approximately 10.8–12.0 MB each). The original product and shrine files remain unchanged in their buddha folders. Expect a loading interval on mobile connections. Each model is centred horizontally, grounded using its bounding-box minimum, and normalized to the product's listed height in metres. Size 100% represents that listed height. This is a visual buying aid: verify catalogue measurements and shelf width/depth physically. No room mesh, occlusion, wall placement, real lighting estimation or finish guarantee is implemented.

## Photo editor

Choose Upload room photo, or try either local illustrated room. Accepted formats: JPEG, PNG, WebP and AVIF, up to 12 MB, at least 128 px per side and no more than 40 megapixels. Images are downsampled to at most 2400 px on the long edge. Exports retain the working image aspect ratio and include every statue without selection outlines or editing controls.

Select a statue by tapping it or its placement chip. Drag to move; drag the top-right handle to resize. Sliders resize and rotate the selected statue. Add another statue, then change its product independently. Keyboard: arrow keys nudge, Delete removes, Ctrl/Cmd+Z undoes while the canvas is focused. Undo stores the last 40 statue edit snapshots; it does not undo room-photo/background changes and resets when switching between camera and photo modes. Reset workspace replaces the arrangement with one selected product and can be undone. Product name, listed price, details and Add to bag stay accessible.

Desktop uses a scrollable floating side panel with a fixed purchase action. Mobile keeps the preview above an independently scrolling control area. Both follow the website's light/dark preference and reduced-motion setting.

## Captures and sharing

Save image exports photo mode and manual camera overlay as PNG. Share uses the device's native file sharing when supported, otherwise downloads the image. Sharing is initiated only by the customer.

Standard immersive WebXR does not expose the physical camera image to this renderer. The Surface AR capture button therefore explains how to use the device screenshot function or switch to camera overlay for an exportable preview. It does not export a misleading transparent model-only image or claim to capture the AR camera feed.

## Privacy and cleanup

Room photos and camera frames remain in browser memory. They are not sent to a server or stored in localStorage. The only persisted state used by this addition is the existing shopping bag/theme system. Cart entries retain the existing `sacredFormCart_v1` array of `{id, qty}` objects through the shared addToCart function.

Camera tracks stop on mode change, closing/leaving the workspace, page hiding and cancellation; late permission responses are stopped if the request was cancelled. XR exit cancels hit testing, aborts model loading, stops rendering and disposes Three.js resources. Upload object URLs and export URLs are revoked. Reloading discards arrangements and photos.

Three.js 0.180.0, GLTFLoader and BufferGeometryUtils are vendored under assets/vendor/three with the upstream MIT license. Room Studio has no external model-loader dependency. Existing storefront fonts and the product/shrine model-viewer retain their previous external providers; no room pixels are passed to them.

## Files

- room.html / assets/css/room-preview.css: workspace, dialogs and responsive controls.
- assets/js/room-preview.js: local photo/camera editor, product/cart bridge, export and lifecycle.
- assets/js/room-xr.js: real GLB rendering and WebXR horizontal hit testing.
- assets/js/room-state.mjs: geometry, undo, surface checks and camera lifecycle helpers.
- assets/css/product-room.css, product.html, assets/js/app.js: product entry button and shared catalogue/cart API.
- assets/images/room-console.svg and room-nook.svg: optional illustrated backgrounds.

## Verification

Run `node --test tests/room-state.test.mjs tests/room-assets.test.mjs tests/room-model.test.mjs`. Nine tests cover placement geometry, inverse rotation/hit testing, independent undo snapshots, upward horizontal surface filtering, camera cancellation/track cleanup/error messages, and all six real models plus transparent image sets. Syntax checks: `node --check assets/js/app.js`, `node --check assets/js/room-preview.js`, `node --check assets/js/room-xr.js`.

Browser checks completed locally: photo upload, independent product selection, drag, corner resizing, rotation, multiple placements, individual removal/undo, backgrounds/presets, 2400×1340 PNG export, Add to bag, unsupported-WebXR messaging, pending camera cancellation, desktop and 390×844 mobile layouts. Preview images are in preview/.

Hardware-dependent camera feed, immersive surface tracking and native sharing still require testing on actual devices. The desktop test browser does not expose immersive WebXR and did not complete camera permission; no live-camera or physical AR success is claimed.

Before production, test these on a compatible phone over HTTPS:

1. Allow and deny camera permission; close during a pending request. Verify the device camera indicator turns off after exit/backgrounding.
2. Start Surface AR, scan a well-lit textured table, wait for the gold marker, place and walk around the actual selected statue.
3. Move, rotate, resize, remove, reset and change through all six products; confirm the base touches the surface and listed height is plausible at 100%.
4. Exit during a model download and return; repeat sessions, rotate the phone and watch for console errors/resource growth.
5. Try an unsupported device and insecure LAN origin: camera/AR must explain the limitation while photo mode remains usable.
6. Upload portrait/landscape photos, arrange several statues, export, share/cancel sharing and verify Add to bag uses the selected product.
7. Recheck shop filters, wishlist, comparison upload/results, product galleries, shrine size/style changes, cart quantities and checkout validation.

References: [WebXR requirements](https://developers.google.com/ar/develop/webxr/requirements), [hit testing](https://developer.mozilla.org/en-US/docs/Web/API/XRSession/requestHitTestSource), [DOM overlay specification](https://www.w3.org/TR/webxr-dom-overlays-1/).

## Mobile AR and camera layout update

Live camera defaults to Fill screen, cropping the feed to the available workspace without stretching it. The Camera layout selector also offers Portrait (9:16) and Landscape (16:9); rotating the device updates the layout automatically. On phones, Statue controls opens/closes a floating control sheet, leaving the live preview full size behind it. Landscape puts the purchase action at the lower right.

Surface AR now renders through a WebGL canvas outside the HTML overlay, uses Three.js's exact XR reference space for hit poses, keeps the statue upright, and previews the actual model at the surface marker before placement. Move statue re-enters this preview. The HTML overlay contains the controls and capture-help dialogs without a duplicate canvas masking the 3D layer.

AR loads dedicated mobile assets through each product's arModel field in assets/models/ar. Original product/shrine GLBs are retained. The mobile copies contain approximately 114k–122k vertices and 1K textures, compared with approximately 482k–508k vertices and 4K textures in the originals. Downloads are approximately 10.8–12.0 MB instead of 36.7–45.0 MB. The PNG texture dimensions reduce decoded texture memory by about 94%; detailed build statistics are in assets/models/ar/build-report.json. No additional runtime compression decoder is needed.

Rebuild mobile copies using node tools/build-ar-models.mjs with Sharp installed (the bundled development runtime also supplies it). The checked-in meshoptimizer 0.25.0 simplifier is build-time only and includes its MIT license. The script keeps source files intact, simplifies with a bounded geometric error and compacts referenced vertices, then repacks embedded 1K textures into standalone GLBs.

Run node --test tests/room-state.test.mjs tests/room-assets.test.mjs tests/room-model.test.mjs for nine checks including feed crop ratios, transformed model grounding, mobile texture/vertex budgets and asset integrity. tests/room-browser.html provides a clearly labelled synthetic camera layout test plus actual GLB loading/rendering checks for all six models. These local tests do not emulate ARCore surface tracking. After updating, reload the HTTPS room.html page on the physical phone and test the gold marker, before-placement statue preview, Place, Move and product changes again.


## AR preview when no surface is detected

The GLB no longer waits for a hit-test result before becoming visible. Once the model loads and the device provides a viewer pose, it previews 0.65 m ahead of the viewer, upright, with its centre on the camera's aim ray. This is real 3D rendering, not the 2D camera overlay. A neutral environment lights metallic finishes; it does not claim camera-based light estimation.

If a horizontal surface is detected, the preview snaps to that hit and Place on surface becomes available. If no surface is detected, Place manually freezes the current 3D position in the XR reference space. The manual mode explicitly states that surface contact has not been checked. Manual preview distance can be adjusted before placing. Move statue resumes the preview; Remove hides it until Move or Reset. Tracking loss hides the object with a clear paused message rather than guessing a new position.

Hit testing is optional at session creation and starts asynchronously. Missing or denied hit testing therefore cannot block model loading or rendering. The canvas remains a visible rendering target outside the HTML overlay. Horizontal hits with either normal direction are accepted and the statue is always kept upright.

Tests now include ten automated checks. tests/room-xr-browser.html exercises the actual AR engine and actual GLB loader with a deliberately simulated XR session and real WebGL rendering. It verifies the zero-hit case, manual placement, surface hits, reversed normals, removal and tracking loss/recovery; it does not validate the phone's camera, ARCore or native XR compositor. A physical phone retest remains required. Reload room.html to receive the 20261031-5 assets; no tunnel restart is needed.

## Android compositor compatibility and on-device diagnostics (build 20261031-6)

The pinned Three.js renderer now has an application opt-in to prefer XRWebGLLayer over XRProjectionLayer when the former is available. Room Studio enables it before attaching the session. This changes native frame submission rather than statue loading/placement. Details of the isolated vendor patch and its upstream context are in assets/vendor/three/AR-COMPATIBILITY.md. The feature does not request raw camera-image access or change browser security flags.

An actual-device failure cannot be diagnosed from a desktop GLB preview alone. During AR, open Statue controls, scroll to AR troubleshooting and press Check 3D display. Copy details includes the build, browser, model readiness, active XR layer, framebuffer dimensions/binding, view count, drawing calls/triangles, view-frustum status and graphics/shader error state. It contains no room photo, camera frame or location coordinates and is never uploaded automatically.

The additional tests/room-xr-native-browser.html harness runs the actual Three.js WebXRManager, actual GLBs, real WebGL rendering and an XR framebuffer. Only the XR device/session is simulated. It advertises projection-layer support but requires the compatibility path; success checks that projection-layer creation was not attempted and that the XR framebuffer contains model pixels with no graphics errors. All six mobile models were checked, including surface placement. This is stronger coverage than the earlier ordinary-renderer adapter, but still does not verify a physical phone's compositor.

## Camera-first interface and capture fix (build 20261031-7)

Live camera and 3D AR fill the workspace behind a transparent header, small status pill and floating action bar. Controls opens a translucent sheet; product information and Add to bag remain accessible when it is collapsed. Portrait and landscape layouts are supported. Room-photo editing retains its existing layout. Styles are isolated in room-live.css.

AR Capture opens an inline, non-modal panel inside the XR DOM overlay. It never calls showModal or makes the workspace inert; controls, placement and closing AR remain available. Opening Capture collapses the controls sheet. Native immersive XR does not expose the physical camera image for ordinary canvas export, so the panel explains how to use the phone's screenshot buttons. Camera overlay and room-photo modes still export PNGs directly. Switching from Capture to Camera overlay waits for XR session shutdown before requesting the camera; session ending is idempotent.

Regression: open tests/room-ui-browser.html on localhost. It loads the actual Room Studio UI with a clearly labelled simulated XR device, real GLB assets and the real Three.js XR renderer. Start Live camera → Start 3D AR. Open Capture repeatedly, dismiss it, place/move the statue, open Controls and change rotation. Verify no native dialog or inert element remains and the controls respond. Choose Camera overlay from Capture; the fixture rejects camera access if XR has not ended, and reports the number of session-end requests. Save image reports PNG dimensions. Check both phone orientations. This fixture uses no real camera and does not replace physical-phone testing. On the phone, reload the HTTPS room.html URL with ?v=7 (or &v=7 if a product query is present) and repeat these actions.

## Mobile editing refinements (build 20261031-11)

The live controls sheet keeps its 340 ms entrance and closes in 150 ms with a quicker exit easing. The floating toolbar returns concurrently instead of waiting for the sheet to finish. Reduced-motion preferences still skip the panel animation.

In camera overlay and room-photo mode, the selected statue has a 44 px Remove button on the top-left selection corner. It follows movement, scaling and rotation, remains inside the workspace, uses the supplied cross icon, and works with the existing Undo history. The top-right scaling handle is unchanged. This editing control is excluded from exported images and hidden in real 3D AR.


## Product-page chooser (build 20261031-14)

View in Your Room now opens an animated native dialog on the product page itself. Closing it keeps the same product and scroll position. Only choosing a mode navigates to Room Studio with that product: entry=sample opens the illustrated room, entry=upload opens a blank photo workspace with Choose a room photo, and entry=live opens the camera options. Uploaded photos continue to be processed locally. Direct room.html links still offer the welcome chooser, with the editor hidden behind it until a choice. Dialog entrance animations respect reduced-motion preferences.


## iPhone and iPad AR (build 20261031-15)

Use the HTTPS website directly in Safari: View in Your Room → Live AR camera → wait for preparation → Open iPhone AR. Choose the AR tab if Quick Look starts in Object view, then scan a table, shelf or floor. Apple controls placement, rotation, scaling and capture inside its native viewer. The website's floating control panel and Add to bag remain on the webpage; return from Quick Look to use them. Embedded browsers that do not advertise AR links get an explicit Safari instruction and retain the camera/photo alternatives.

Room Studio detects Apple mobile devices, including iPad desktop-mode Safari, and checks rel=ar support. It loads the local, pinned Google model-viewer 4.1.0 library only when preparing Apple AR. assets/js/room-ios.js loads the actual product's mobile GLB, scales it to the listed height in metres, then prepares a USDZ blob before exposing a native rel=ar link with an image child. This avoids delayed programmatic activation and uses Safari's normal native handoff. Files are generated on the device, not uploaded. Conversion status/errors remain visible. Object URLs and viewer elements are cleaned up on product replacement and page exit. Source GLBs and Android WebXR code are unchanged. The vendored dependency and Apache license are under assets/vendor/model-viewer/.

Validation: node --test tests/room-ios.test.mjs verifies device routing. tests/room-ios-browser.html loads, normalizes and exports all six actual statues; checks ZIP signatures, nonempty USDZ files and final model heights (0.15–0.32 m). All six passed with the pinned library. Results are saved in preview/apple-ar-conversion-report.json. tests/room-ios-ui-browser.html uses a clearly labelled simulated iPhone identity and AR-link capability to exercise the actual UI and real USDZ preparation; it does not launch or validate Apple's native viewer. Physical iPhone Safari testing remains required. Android continues to use the existing WebXR route.

References: https://developer.apple.com/quick-look-gallery/ and https://modelviewer.dev/docs/ (AR Quick Look and prepareUSDZ).
# Direct touch controls

In browser surface AR, swipe horizontally on the statue with one finger to rotate around its upright axis. Pinch/spread with two fingers to resize (50–200% of listed height); two-finger twisting does not rotate the AR model. The statue stays grounded at its existing placement. Buttons, sliders and the control panel do not initiate gestures. Existing Move and Reset controls remain available.

The room-photo editor and manual camera overlay also accept the same two-finger gestures, with one-finger dragging retained. One gesture is one undo step in these 2D modes. Sliders stay synchronized and remain available for precise edits and desktop use.

Apple's native AR Quick Look owns its touch interactions; this site's browser gesture handler cannot run inside that native viewer. Use Quick Look's native manipulation gestures there.

Test on a compatible phone over HTTPS: place each statue, swipe with one finger through 180°, pinch smaller/larger, lift either finger, and confirm no accidental placement or panel opening. Repeat with controls open, change products, remove/reset the statue, and close/reopen AR. In photo mode, also confirm Undo restores the previous size and rotation together. Automated gesture checks: `node --test tests/room-gestures.test.mjs`. Hardware surface tracking still requires a real device test.

