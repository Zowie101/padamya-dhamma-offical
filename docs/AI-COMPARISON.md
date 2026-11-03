# AI shrine-photo comparison

The comparison page retains its on-device algorithm and adds an unchecked **Use Gemini photo analysis** option. Merely uploading a photo never calls Google. Selecting this option and submitting the comparison explicitly sends the resized photo and two public product references through the same-origin backend to Gemini. The customer-facing notice discloses Google free-tier data use and links its terms.

## Setup

Uses the existing server-only `GEMINI_API_KEY` and `GEMINI_MODEL` settings. Optional `COMPARISON_MODEL` overrides only the vision model. The tested model is `gemini-3.5-flash-lite`. No database migration or new dependency is required.

## Data flow and limits

- Browser canvas converts the upload to a JPEG of at most 1024 pixels on its longest side, stripping filename and EXIF metadata from the transmitted image. The original remains a local object URL.
- `POST /api/comparison` requires the same session/CSRF checks as other storefront actions, explicit consent, two different catalogue IDs and a bounded base64 JPEG. It validates signature and dimensions before calling Gemini. At most two analyses run concurrently per server process; profile and IP rate limits also apply.
- Only public catalogue details/product images accompany the room image. No name, email, cart, orders or account information is sent to Google.
- The application keeps image bytes in memory for the request, with no photo/result persistence to database, files or logs. Google handles submitted material under its own terms; this is not a promise that Google retains nothing.
- Provider output uses a constrained function response and server-side schema validation. Duplicate/invented IDs and invalid scores are rejected. Model text is displayed as escaped text, never trusted HTML.
- AI rates palette, contrast and composition. Listed heights and customer-entered clearance determine physical height eligibility on the server. A product exceeding that height cannot win. Scores are subjective comparisons, not probabilities, measurements or sacred-suitability advice. Width, depth, loading and actual finishes still require checking.
- Failed, unsupported, busy, ambiguous or timed-out AI requests show the labelled on-device fallback. Changing any input cancels the UI request and discards stale results.

## Verification

`node --test tests/comparison.test.mts` checks consent and CSRF, JPEG limits, ID/score validation, no-fit constraints and safe failure. Full regression suite: `node --run test`. Test real vision only with a synthetic/public room image or a photo whose owner has explicitly agreed to Google processing. Preview test images belong in the ignored `preview/` folder.

Sources: [Gemini images](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding), [Gemini data terms](https://ai.google.dev/gemini-api/terms).
