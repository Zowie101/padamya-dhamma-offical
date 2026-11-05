# Sage shopping assistant

Sage appears on all storefront root pages, including order pages; the sign-in/sign-up page is excluded. It is hidden during immersive live camera/AR mode so camera controls remain accessible. Open the gold chat button at the lower right. Escape, minimize or close hides the panel; Clear conversation starts again. Enter sends, Shift+Enter adds a line. Conversation history stays in sessionStorage for that tab and local profile. Product actions reuse the existing bag system.

## Modes

Default `.env` setting `SAGE_PROVIDER=demo` runs catalogue rules locally with no API call or key. The panel explicitly says **guided shopping**. It supports MMK budgets, small spaces, finishes, gifts, named comparisons, current bag totals and store/order navigation. This is a practical guided assistant, not a claim of human-level language understanding. USD requests ask for an MMK budget rather than inventing an exchange rate. Missing inventory is shown as stock not recorded.

To connect Gemini later, put these values in the private `.env` file and restart:

```dotenv
SAGE_PROVIDER=gemini
GEMINI_API_KEY=your_private_key
GEMINI_MODEL=your_account_supported_model_id
```

Alternatively:

```dotenv
SAGE_PROVIDER=openai
OPENAI_API_KEY=your_private_key
OPENAI_MODEL=your_account_supported_model_id
```

For NVIDIA-hosted DeepSeek:

```dotenv
SAGE_PROVIDER=nvidia
NVIDIA_API_KEY=your_private_nvidia_key
NVIDIA_MODEL=deepseek-ai/deepseek-v4.1-flash
```

Create the key on NVIDIA Build, not on DeepSeek's direct API site. The endpoint is fixed server-side to `https://integrate.api.nvidia.com/v1/chat/completions`. No base URL setting or frontend key is needed. Restart the running server after saving `.env`. A configured NVIDIA response still passes the same product/tool validation; errors return labelled guided help. This adapter was tested with simulated API responses; live account access must be verified after the owner adds their key. NVIDIA's prototype usage and limits are determined by their account terms.

Use a model your provider account supports for function calling. Keys and models are intentionally blank in `.env.example`. No live provider call was performed during implementation. Pricing, free allowances and availability depend on your provider account; no free quota is promised. Workers AI and Mistral adapters are not included.

NVIDIA uses Chat Completions tool calls. Gemini uses generateContent function calls. OpenAI uses Responses function calls with `store:false`. Only the server receives keys. Provider errors/timeouts, missing credentials and invalid tool outputs return a clearly labelled guided fallback, not a fabricated AI answer.

## Grounding and actions

Server tools are `search_products`, `compare_products`, `cart_summary`, `navigate` and `respond_to_customer`. Zod validates arguments. Recommendations must reference actual products returned by search/comparison. Navigation is limited to known storefront pages. Product cards, specifications and totals are rendered from current catalogue data, not LLM HTML. API responses cannot execute scripts, place orders, update stages or grant admin privileges. Adding a product requires an explicit click and reuses stock-validated bag synchronization.

The model sees chat messages, public catalogue data and, when requested, that session's bag summary. Customer addresses, passwords and order records are not included in the prompt or available as tools. Text a customer types into chat will be sent to the chosen provider only when real AI is configured; do not enter passwords or payment details. Chat is not persisted on the server. No API key is needed for guided mode.

The endpoint limits messages, lengths and roles, checks CSRF and applies a 12 requests/minute/profile limit. Each Sage response has a shared 20-second deadline; Gemini/OpenRouter allow at most three tool rounds, other tool adapters five; Groq uses one strict structured-output request. These process/database limits are suitable for local testing; production needs centralized abuse protection.

## Files

- `assets/js/sage-core.js`: shared deterministic catalogue logic.
- `server/sage.mts`: validated tools and provider adapters.
- `assets/js/sage.js`, `assets/css/sage.css`: accessible, responsive widget.
- `tests/sage.test.mts`, `tests/backend.test.mts`: actual-catalogue rules, adversarial tool validation, mocked provider loops, API authentication/rate checks.

## Try it

1. Start the Node server and open a product or shop page.
2. Open Sage and ask `Show statues under 50000 MMK`.
3. Add a recommendation, then ask `Show my cart`.
4. Ask `Compare Golden Presence and Quiet Meditation`.
5. Ask `How do I track my order?` and use its link.
6. Minimize/reopen or move to another page in the same tab; conversation history remains.
7. Test mobile keyboard, Enter/Shift+Enter, Escape and reduced motion.
8. With an intentionally unavailable provider in a private test environment, confirm the labelled guided fallback. Mock tests also cover provider failures without any external API calls.

The launcher uses the supplied `chat_icon.svg`, and the header avatar uses `sage_icon.svg`. Fast replies keep the typing indicator visible for approximately 650 ms, then enter with a short fade/slide; product cards appear with a small stagger. Existing conversation history does not replay the animation. Reduced-motion settings skip the pause and animations.

Replies reveal word by word after the response arrives, followed by each rich block and product card in order. This is client-side presentation, not network token streaming. Restored history stays instant. Pending submission stays locked until reveal completes; navigation cancels its timer. Reduced-motion preference displays the complete reply immediately. Shared icon feedback lives in `assets/css/icon-motion.css` across storefront and Room Studio pages.

## Response speed and safe fallback

Gemini receives a compact, verified catalogue snapshot so ordinary shopping questions can finish in one function-call response. Recommendations still pass product-ID validation. Gemini 3 Flash/Lite uses reduced thinking effort; other supported Gemini 3 models use low effort. Tool chains are capped at three calls and the AI deadline is 20 seconds. Timeouts, quota errors and provider overload trigger a 30-second cooldown with clearly labelled rule-based catalogue help. No provider error bodies, conversations or keys are logged.

The chat displays the validated response immediately rather than waiting on a separate catalogue refresh. This prevents an unrelated catalogue failure from discarding a successful AI answer. Request durations can still include server/database work, network delays and a sleeping Render free instance. A guided fallback is not a Gemini answer.

Check safe Render logs for `Sage gemini: TIMEOUT`, `HTTP_429` (quota/rate limit), `HTTP_503` (provider overload), `HTTP_404` (model/configuration), or `INVALID_RESPONSE`. Do not paste API keys or provider request bodies into logs. Run `node --test tests/sage.test.mts tests/sage-client.test.cjs` for response-path regressions.

## Groq setup

Set these in Render > service > Environment (or privately in the environment file used to start your local server):

```dotenv
SAGE_PROVIDER=groq
GROQ_API_KEY=your_private_groq_key
GROQ_MODEL=openai/gpt-oss-120b
```

Deploy the updated backend before switching providers. Save and redeploy/restart after changing settings. Never commit keys. Keep GEMINI_API_KEY and GEMINI_MODEL/COMPARISON_MODEL for shrine-photo comparison: Sage's Groq text adapter does not replace it.

Groq uses the fixed Chat Completions endpoint, low reasoning for GPT-OSS and one strict JSON-schema response per customer message. It does not send tools or tool_choice, avoiding the failing tool-call generation path. Use openai/gpt-oss-120b (or another model supporting strict structured outputs). The server validates the complete JSON result before mapping product IDs, comparisons, navigation and current-session bag requests to existing internal validation functions. Prices and totals remain server-calculated. Only the public catalogue, conversation and current-session bag summary are sent; no customer addresses or order records. Mock tests cover five consecutive turns, Burmese text transport, comparisons, bag totals, navigation, invented IDs, malformed JSON and provider failures. Live speed, account quota and Burmese quality must be checked with your own key; passing mock tests does not prove live provider availability.

Gemini HTTP 503 overload receives one retry after 750 ms, within the same 20-second deadline. Persistent overload returns labelled help and a 30-second cooldown. No retry occurs for invalid credentials or quota errors.

## OpenRouter + Gemini

In Render > Environment (or your private local environment file), configure:

```dotenv
SAGE_PROVIDER=openrouter
OPENROUTER_API_KEY=your_private_openrouter_key
OPENROUTER_MODEL=google/gemini-3.1-flash-lite
```

Publish the backend first, then save and deploy the environment changes. Never paste keys into chat, frontend files, or Git. OpenRouter credits must cover the model's usage; a key spending limit is not an account balance. Keep direct Gemini settings for shrine-photo comparison, which this Sage-only change does not migrate.

Requests use the fixed https://openrouter.ai/api/v1/chat/completions endpoint, Gemini minimal reasoning, a verified catalogue snapshot, and up to three validated tool rounds within the same 20-second deadline. Provider routing allows fallback providers, requires request-parameter support and sorts by latency. No alternate model is silently selected. HTTP 402 indicates insufficient credits, 401 authentication, 429 quota/rate limits, and 503 provider unavailability. Embedded provider errors are handled safely. Logs and fallback responses exclude raw error bodies, keys and reasoning metadata.

Mock tests cover catalogue recommendations, multi-turn chat, tool metadata, navigation, invalid IDs, missing credentials and provider errors. They do not establish live OpenRouter availability, account access, latency or Burmese quality. After configuring your key, test at least three follow-ups, one Burmese question, budget recommendations, comparison, bag totals and order-page navigation on the deployed site. Routing failover is not a guarantee of uptime.

## Diagnose Gemini from Render

Set `GEMINI_DIAGNOSTICS=true` temporarily in Render Environment, then save and deploy. Startup launches a private background probe without blocking the health check. It logs one `Gemini diagnostic:` report comparing a minimal text request with Sage's actual catalogue-and-functions request. It uses a synthetic empty cart, no customer account or history. Reports contain only model name, configuration presence, timings, HTTP codes and fixed error classifications; never raw provider errors or keys. The probe consumes API quota (normally two calls, potentially more for function rounds or the bounded overload retry).

If both fail, investigate the provider/account/network route. If minimal text passes but Sage fails, investigate the function request or its response. A timeout alone does not establish which service is at fault. Disable `GEMINI_DIAGNOSTICS` after collecting the report. Normal provider failures now log safe reasons such as `overloaded`, `quota_or_rate_limit`, `region_restricted`, `authentication` or `invalid_request`. Rate-limit cooldown respects a numeric Retry-After header, capped at five minutes. Provider names, keys and model settings are trimmed to avoid accidental whitespace configuration errors.

## Sage voice and statue background

Sage has a consistent female AI persona: friendly, lively and concise, with respectful discussion of sacred imagery. Burmese uses ကျွန်မ and occasional ရှင် / နော်. System instructions are sent on every request for all providers; the welcome message and bilingual catalogue fallback also use this voice. This guides the model rather than guaranteeing every generated word.

The six supplied product asset sets have bilingual cultural notes in `assets/js/sage-core.js`. These are image-based observations with qualified mudra identification, not certified attribution. The notes are omitted if an asset set changes. Dhyana is traditionally connected with meditation and concentration ([Jogye Order explanation](https://jokb.org/bbs/board.php?bo_table=1020&device=pc&page=3&wr_id=20)). A raised outward-facing palm is consistent with Abhaya, reassurance/fearlessness ([Met Museum](https://www.metmuseum.org/art/collection/search/38965)). Earth-touching imagery requires the lowered hand toward the earth ([Smithsonian](https://asia-archive.si.edu/exhibition/beyond-death-and-desire/)). These sources explain general iconography; they do not authenticate the shop's products.

Image review found that `earth-touching` holds a bowl in the lap rather than touching the earth, and `gentle-blessing` holds a vessel rather than raising a blessing hand. Their display names are now **Lotus Meditation** and **Gentle Serenity**. Their exact formal mudras remain unconfirmed; Sage must not invent a particular Buddha identity, origin, date, artisan, consecration or spiritual benefit. Other supplied lap-hand poses are described as consistent with meditation, and Lotus Stillness as consistent with Abhaya.

Product IDs, URLs, stock, prices, saved bags and order snapshots are unchanged. A one-time SQLite/PostgreSQL migration updates only the two old default names when their original asset sets still match. Custom names are preserved. Historical orders keep the names recorded at checkout. The fallback accepts the old names; all AI providers receive them as aliases. Frontend default data and Myanmar translations use the new names. Presentation files are intentionally separate.

Try: “Explain Lotus Meditation's mudra”, “What does Lotus Stillness's hand gesture mean?”, “Tell me about Gentle Serenity in Burmese”, and a follow-up using an old product name. Generated phrasing and language quality still need a live check with the configured provider.
