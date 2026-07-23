# Browser Tests

Playwright-based browser tests for the Open Banking frontend.

## Test modes

### Mock (`@mock`)

All specs and mock journeys run under this mode, locally and in CI. APIs are stubbed by WireMock, mappings live in `wiremock/mappings/`.

```shell
npm run build # must be re-run if changing the application `src` code, otherwise only needs to be run once
npm run test:browser
```

> If you've recently cloned the repo or Playwright has been updated, run `npx playwright install chromium` first.

For help debugging you can also run the browser tests in UI mode (which will spawn a Playwright Chrome for Testing process) by running `npm run test:browser:ui`.

Browser tests use a 'built' version of the application which is a more accurate representation of the production image. `mock-setup.ts` spawns any required [TestContainers](https://node.testcontainers.org/) and ensures they are cleaned up after the test run.

Mobile and tablet coverage is achieved via the `chromium-mobile` and `chromium-tablet` projects in `playwright.mock.config.ts`. To run a single project:

```shell
npm run test:browser -- --project=chromium-mobile
```

> [!TIP]
> Browser tests can be run independently of any locally running dev server. They manage their own test container lifecycle and use a different port for the running application. E.g. a local dev server won't cross-contaminate any browser testing session storage and vice versa.

### Smoke (`@smoke`)

Run in CodePipeline against a deployed CloudFormation stack. Requires `APP_URL` env var pointing to the deployed stack.

```bash
APP_URL=https://... npx playwright test --config playwright.smoke.config.ts
```

## Fixtures

| Export        | Use for                                                         |
|---------------|-----------------------------------------------------------------|
| `desktopTest` | Skips on `chromium-mobile` (covers desktop + tablet) (WireMock) |
| `mobileTest`  | Runs on `chromium-mobile` only (WireMock)                       |
| `smokeTest`   | Smoke journeys (AWS)                                            |

## Auto-fixtures (applied to every test automatically)

| Fixture           | Behaviour                                                                             |
|-------------------|---------------------------------------------------------------------------------------|
| `noConsoleErrors` | Fails if any `console.error` is emitted. Disable with `skipConsoleErrors: true`       |
| `resetLanguage`   | Sets `lng=en` cookie before each test to prevent language state leaking between tests |

## Opt-in helpers

| Helper     | Behaviour                                                                                         |
|------------|---------------------------------------------------------------------------------------------------|
| `runAxe`   | Runs axe-core WCAG 2.2 AA scan on the current page. Call for one element-assertion test per spec. |
