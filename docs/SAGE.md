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

Use a model your provider account supports for function calling. Keys and models are intentionally blank in `.env.example`. No live provider call was performed during implementation. Pricing, free allowances and availability depend on your provider account; no free quota is promised. OpenRouter, Workers AI and Mistral adapters are not included.

NVIDIA uses Chat Completions tool calls. Gemini uses generateContent function calls. OpenAI uses Responses function calls with `store:false`. Only the server receives keys. Provider errors/timeouts, missing credentials and invalid tool outputs return a clearly labelled guided fallback, not a fabricated AI answer.

## Grounding and actions

Server tools are `search_products`, `compare_products`, `cart_summary`, `navigate` and `respond_to_customer`. Zod validates arguments. Recommendations must reference actual products returned by search/comparison. Navigation is limited to known storefront pages. Product cards, specifications and totals are rendered from current catalogue data, not LLM HTML. API responses cannot execute scripts, place orders, update stages or grant admin privileges. Adding a product requires an explicit click and reuses stock-validated bag synchronization.

The model sees chat messages, public catalogue data and, when requested, that session's bag summary. Customer addresses, passwords and order records are not included in the prompt or available as tools. Text a customer types into chat will be sent to the chosen provider only when real AI is configured; do not enter passwords or payment details. Chat is not persisted on the server. No API key is needed for guided mode.

The endpoint limits messages, lengths and roles, checks CSRF and applies a 12 requests/minute/profile limit. Each Sage response has a shared 20-second deadline; Gemini/Groq allow at most three tool rounds, other adapters five. These process/database limits are suitable for local testing; production needs centralized abuse protection.

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

Groq uses the fixed Chat Completions endpoint, low reasoning for GPT-OSS, sequential validated tools and a preloaded verified catalogue to reduce round trips. Mock tests cover valid replies, tool history, invented IDs and provider failures. Live speed, account quota and Burmese quality must be checked with your own key; passing mock tests does not prove live provider availability.

Gemini HTTP 503 overload receives one retry after 750 ms, within the same 20-second deadline. Persistent overload returns labelled help and a 30-second cooldown. No retry occurs for invalid credentials or quota errors.
