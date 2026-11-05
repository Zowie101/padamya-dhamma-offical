# AI shrine-photo comparison

The comparison page keeps its on-device algorithm and offers an unchecked **Use AI photo analysis** option. Upload alone never calls an AI provider. Selecting AI and submitting sends the resized room photo and two public product references through the same-origin backend to the configured service. The notice explains external processing and links Google terms and OpenRouter privacy policies.

## Provider settings

When `SAGE_PROVIDER=openrouter`, comparison automatically uses `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. A direct Google key is not needed for this route. The selected model must support image input and structured outputs. Optional `OPENROUTER_COMPARISON_MODEL` selects a separate vision model. Optional `COMPARISON_PROVIDER=openrouter` or `gemini` overrides automatic selection. Otherwise comparison uses direct Gemini with `GEMINI_API_KEY` and `COMPARISON_MODEL` (or `GEMINI_MODEL`). Old direct-Google `COMPARISON_MODEL` values are not accidentally sent to OpenRouter.

```dotenv
SAGE_PROVIDER=openrouter
OPENROUTER_API_KEY=your_private_key
OPENROUTER_MODEL=google/gemini-3.1-flash-lite
# Optional:
COMPARISON_PROVIDER=openrouter
OPENROUTER_COMPARISON_MODEL=google/gemini-3.1-flash-lite
```

Save secrets only in the server environment. Existing OpenRouter Sage configuration needs no additional settings. No database migration or dependency is needed. Direct Gemini remains supported and uses minimal/low thinking where applicable.

## Data flow and limits

- The browser converts uploads to JPEG with at most 1024 pixels on the longest side, removing filenames and EXIF metadata from the transmitted image. The original remains a local object URL.
- `POST /api/comparison` requires session/CSRF checks, explicit consent, two distinct available catalogue IDs and bounded JPEG data. Signature/dimensions are checked before sending. Per-profile/IP rate limits and the existing two-analysis concurrency cap remain.
- Only public catalogue details and product images accompany the room image. No names, emails, orders, account records or bag contents are sent.
- Image bytes stay in application memory for the request, without saving photos/results to files, logs or the database. External providers apply their own retention policies; this does not promise they retain nothing.
- OpenRouter receives one multimodal Chat Completions request: room first, then labelled product references as image data URLs. Strict JSON-schema output and server validation reject invented/duplicate IDs, invalid scores, malformed JSON and truncated responses. Direct Gemini retains its constrained function response. Model text is escaped before rendering.
- AI assesses visible palette, contrast and composition. Entered clearance and listed heights are checked on the server. A piece exceeding the entered height cannot win. Scores are subjective, not probabilities, physical measurements or sacred-suitability judgments. Width, depth, stability and true finish still require checking.
- One 35-second deadline bounds a provider request. Failed, unsupported, unclear or timed-out analysis returns a safe error and the UI labels the on-device fallback. No automatic photo retries or cross-provider resubmission occur. Input changes cancel the UI request and discard stale responses.
- Logs contain only provider name, safe error classification and status, never photos, provider response bodies or keys.

## Verification

`node --test tests/comparison.test.mts tests/hero-language.test.cjs` covers consent/CSRF, JPEG limits, routing, three-image OpenRouter payloads, Burmese prompts, structured validation, height eligibility, safe failures and timeout. Mock tests do not prove live model availability or vision quality. For a live check, use a synthetic/public room image or a photo with explicit owner consent. Save preview images in ignored `preview/`.

Implementation references: [OpenRouter image inputs](https://openrouter.ai/docs/guides/overview/multimodal/image-understanding), [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [Google data terms](https://ai.google.dev/gemini-api/terms), [OpenRouter privacy](https://openrouter.ai/privacy).
