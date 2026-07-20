# Browser Test Coverage

## Directory Structure

```
test/browser/
├── fixtures.ts              # Extended test fixtures (axe, console errors, language reset)
├── constants.ts             # Route path constants derived from src/config/paths
├── mock-setup.ts            # Global setup: spins up DynamoDB, WireMock, and app via TestContainers
├── helpers/
│   ├── navigation.ts        # High-level navigation helpers (navigateToChooseBank, navigateToConsent, etc.)
│   ├── wait-strategies.ts   # waitForElement, navigateAndWait, waitWithBackoff
│   ├── keyboard.ts          # tabToElement, activateWithKeyboard
│   └── core-stub.ts         # AWS SigV4-signed requests to the headless core stub (smoke only)
├── pages/                   # Page Object Models
│   ├── start.page.ts
│   ├── choose-bank.page.ts
│   ├── consent.page.ts
│   ├── authorise.page.ts
│   └── callback.page.ts
├── specs/                   # Page-focused specs run under playwright.mock.config.ts
├── journeys/
│   ├── mock/                # End-to-end journeys run against WireMock (playwright.mock.config.ts)
│   └── smoke/               # Journeys run against a deployed environment (playwright.smoke.config.ts)
└── wiremock/
    ├── mappings/            # Static WireMock stub mappings (ob-success, ob-error, ob-failure)
    └── admin.ts             # WireMock admin API client (addMapping, verify, resetScenarios, etc.)
```

## Fixtures (`fixtures.ts`)

All specs should import `test` (or `mockTest`/`smokeTest`) from `fixtures.ts` rather than directly from `@playwright/test`.

| Export | Use for |
|---|---|
| `test` | Specs — includes auto-fixtures below |
| `mockTest` | Mock journeys — adds `wiremock` fixture, resets scenarios/requests before each test |
| `smokeTest` | Smoke journeys |

### Auto-fixtures (applied to every test automatically)

| Fixture | Behaviour |
|---|---|
| `axeCheck` | Runs axe-core WCAG 2.2 AA scan after each test. Disable per-test with `skipAxe: true` |
| `noConsoleErrors` | Fails if any `console.error` is emitted (excludes resource load failures, font errors, Vite WS noise). Disable with `skipConsoleErrors: true` |
| `resetLanguage` | Sets `lng=en` cookie before each test to prevent language state leaking between tests |

## Helpers

### `wait-strategies.ts`

| Function | Purpose |
|---|---|
| `waitForElement(locator, opts?)` | Waits for visible + attached state. Adds an attached check for buttons and inputs |
| `navigateAndWait(page, trigger, expectedUrl, opts?)` | Registers the URL listener _before_ triggering navigation to avoid race conditions. Uses `waitUntil: 'load'` |
| `waitWithBackoff(condition, opts?)` | Polls a condition with exponential backoff |

### `navigation.ts`

High-level helpers that drive the app to a specific page state, used across specs to avoid duplication.

| Function | Navigates to |
|---|---|
| `navigateToRoot(page)` | `/` |
| `navigateToChooseBank(page)` | `/choose-bank` (via start page continue) |
| `navigateToConsent(page)` | `/agree-share-bank-information` (selects `ironforge-vault`, continues) |
| `navigateToChooseBankWelsh(page)` | `/choose-bank` via Welsh-language start page |
| `selectWelsh(page)` | Clicks the Cymraeg language toggle |

### `keyboard.ts`

| Function | Purpose |
|---|---|
| `tabToElement(page, selector, maxTabs?)` | Tabs until the given selector is focused (max 30 tabs by default) |
| `activateWithKeyboard(page, selector)` | Focuses element and presses Enter |

### `core-stub.ts`

Used by smoke tests only. SigV4-signs a POST to `CORE_STUB_URL/start` and returns `{ client_id, request }` for initiating a journey against a deployed environment. Accepts an optional `sharedClaims` object included in the request body. Requires `CORE_STUB_URL` env var.

## WireMock

Static mappings in `wiremock/mappings/` define the three API states used by mock journeys:

| Mapping file | Scenario |
|---|---|
| `ob-success.json` | Successful bank authorisation |
| `ob-error.json` | Bank returns an error |
| `ob-failure.json` | General failure response |

The `wiremock/admin.ts` client exposes: `addMapping`, `getRequest`, `getRequests`, `verify`, `reset`, `resetRequests`, `resetScenarios`.

## Configurations

| Config | Command | Devices (projects) | Test files | Base URL |
|---|---|---|---|---|
| `playwright.mock.config.ts` | `npm run test:browser` / `test:browser:ui` | `chromium-desktop`, `chromium-mobile` (Pixel 5), `chromium-tablet` (iPad Pro) | `journeys/mock/**/*.journey.ts`, `specs/**/*.spec.ts` | `localhost:5091` (managed by `mock-setup.ts`) |
| `playwright.smoke.config.ts` | `APP_URL=https://... npx playwright test --config playwright.smoke.config.ts` | Desktop Chrome | `journeys/smoke/**/*.journey.ts` | `APP_URL` env var |

> To scope a run to one device, pass `--project=chromium-mobile` (etc.). Mobile-only specs gate themselves with `test.skip(({ isMobile }) => !isMobile, 'mobile only')`.

## Spec Coverage

All specs run under `playwright.mock.config.ts`. Specs that only make sense on a mobile viewport gate themselves with `test.skip(({ isMobile }) => !isMobile, 'mobile only')`.

| Spec | What it covers |
|---|---|
| `start.spec.ts` | Start page content, continue navigation, prove another way link |
| `choose-bank.spec.ts` | Bank selection, validation, Welsh language |
| `consent.spec.ts` | Consent checkbox, error states, prove another way |
| `prove-another-way.spec.ts` | Prove another way page |
| `error-failure-pages.spec.ts` | 404 and error page rendering |
| `layout.spec.ts` | Common layout elements (header, footer) |
| `cookie-banner.spec.ts` | Cookie banner accept/reject behaviour |
| `language.spec.ts` | English/Welsh language switching |
| `keyboard-navigation.spec.ts` | Tab order, keyboard activation |
| `security-validation.spec.ts` | CSRF, session, input validation, security headers |
| `mobile-responsiveness.spec.ts` | Touch interactions, viewport, responsive layout (mobile project only) |
| `cross-browser-compatibility.spec.ts` | Form/CSS/JS consistency |
| `performance.spec.ts` | Page load and interaction timing |

## Journey Coverage

| Journey | Config | Scenario |
|---|---|---|
| `mock/ob-success.journey.ts` | mock | Full happy path: start → choose bank → consent → bank redirect → callback |
| `mock/ob-error.journey.ts` | mock | Bank returns an error during authorisation |
| `mock/ob-prove-another-way.journey.ts` | mock | User exits via prove another way |
| `mock/ob-banks-unavailable.journey.ts` | mock | Banks unavailable — skipped pending real `/banks` API wiring in `banks.client.ts` |
| `smoke/ob-success.journey.ts` | smoke | Happy path against a deployed environment |

## Routes Without Standalone Specs

These routes are only reachable via a full mock journey:

| Route | Covered by |
|---|---|
| `/sorry-problem-bank` | mock journeys |
| `/banking-no-match` | mock journeys |
| `/use-current-account` | mock journeys |
