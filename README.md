# Open Banking Credential Issuer Frontend

Frontend code for the Open Banking CRI

### Stack choices

- TypeScript
- Express
- DynamoDB
- Vite/Vitest
- Playwright/Playwright BDD
- Prettier/Eslint

This project uses `perfectionist` and makes a number of opinionated choices on how code should be formatted and organised. See the `esling.config.ts` for more details.

DynamoDB is required in all environments for session storage.

### Local dev

Vite handles the local dev experience in middleware mode.

First, ensure that all project dependencies are loaded:

```shell
fnm use # or nvm (ensures a project appropriate node version is active)
npm i
```

Vite handles all static asset bundling for you so there is no additional build step. 

Copy the `.env.example`, some env vars are pre-configured for you (`REBRAND_ENABLED`, `USE_PINO_LOGGER` and `LOCAL_DYNAMO_ENDPOINT_OVERRIDE`).

```shell
cp .env.example .env
```

Start a dev server:

```shell
npm run dev
```

Vite will also spawn the required local dev containers defined in the project root `docker-compose.yml`. 

> [!IMPORTANT]  
> A running Docker socket must be available on your system.

The frontend should now be running on the `PORT` set in your env or on 3000 by default if none was set.

Vite will monitor the following for changes:

Any server side code (this is actually `tsx` monitoring the server code and will force an application restart. It may take a second or two for your changes to visible in the browser).

Any client side code (client side JS, CSS). Changes here will be hot reloaded into the running application without the need for a restart and should be reflected in the browser immediately without a page reload.

Locales (YML), JSON and Nunjucks files are also monitored and will trigger an automatic page reload when updated.

### Tests

There are two types of tests in the project:

- unit tests (using the Vitest runner)
- browser tests (using Playwright and Playwright BDD)

Tests are organised in the `test` directory and further categorised as follows:

#### Unit tests

- `test`/`unit`/`path`/`to`/`code.test.ts`
  - for example, if you are writing a unit test for a controller located at `src/controllers/index.controller.ts` then you would create your test at `test/unit/controllers/index.controller.test.ts`
  - if you don't postfix your test file name with `test.ts` it won't be automatically picked up by the test runner

#### Browser tests

Browser tests are organised by feature and use Playwright BDD Given, When, Then `.feature` files to describe a test. These live in `test/browser/features`

Steps are written in TypeScript and live in `test/browser/steps`

The following commands will start a browser test run:

```shell
npm run build # must be re-run if changing the application `src` code, otherwise only needs to be run once
npm run test:browser
```

For help debugging you can also run the browser tests in UI mode (which will spawn a Playwright Chrome for Testing process) by running `npm run test:browser:ui`

Browser tests use a 'built' version of the application which is a more accurate representation of the production image. In addition, the browser test setup will spawn any required [TestContainers](https://node.testcontainers.org/) and ensure they are cleaned up after the test run.

> [!TIP]
> Browser tests can be run independently of any locally running dev server. They manage their own test container lifecycle and use a different port for the running application. E.g. a local dev server won't cross-contaminate any browser testing session storage and vice versa.

### Environment Variables

| Environment variable                  | Description                                                                                               | Required        |
|---------------------------------------|-----------------------------------------------------------------------------------------------------------|-----------------|
| `PORT`                                | Port the app listens on. Default: `3000`                                                                  | No              |
| `BIND_HOST`                           | Network interface to bind to. Default: `127.0.0.1`                                                        | No              |
| `NODE_ENV`                            | Runtime environment (`development`, `production`, `test`). Affects Helmet CSP and other security settings | No              |
| `API_BASE_URL`                        | Base URL of the Open Banking API. Default: `http://localhost:5007/`                                       | Yes (non-local) |
| `EXTERNAL_WEBSITE_HOST`               | Public-facing base URL of this app, used for redirects and links. Default: `http://localhost:5090`        | Yes (non-local) |
| `SESSION_SECRET`                      | Secret used to sign session cookies. Falls back to `hunter2` locally                                      | Yes (non-local) |
| `SESSION_TABLE_NAME`                  | DynamoDB table name for session storage. Default: `ob-sessions-local`                                     | Yes (non-local) |
| `SESSION_TTL`                         | Session lifetime in milliseconds. Default: `7200000` (2 hours)                                            | No              |
| `LOCAL_DYNAMO_ENDPOINT_OVERRIDE`      | Override the DynamoDB endpoint (e.g. `http://localhost:8000`). Used for local dev and browser tests       | No              |
| `FRONTEND_DOMAIN`                     | Cookie domain for analytics cookies. Default: `localhost`                                                 | No              |
| `DEVICE_INTELLIGENCE_DOMAIN`          | Domain used for device intelligence requests. Default: `localhost`                                        | No              |
| `DEVICE_INTELLIGENCE_ENABLED`         | Enable device intelligence (`true`/`false`). Default: `false`                                             | No              |
| `GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID` | GTM container ID for GA4. Default: `GTM-XXXXXXX`                                                          | No              |
| `GA4_ENABLED`                         | Enable GA4 analytics (`true`/`false`). Default: `true`                                                    | No              |
| `ANALYTICS_DATA_SENSITIVE`            | Mark analytics data as sensitive (`true`/`false`). Default: `true`                                        | No              |
| `GA4_PAGE_VIEW_ENABLED`               | Enable GA4 page view events. Default: `true`                                                              | No              |
| `GA4_FORM_RESPONSE_ENABLED`           | Enable GA4 form response events. Default: `true`                                                          | No              |
| `GA4_FORM_ERROR_ENABLED`              | Enable GA4 form error events. Default: `true`                                                             | No              |
| `GA4_FORM_CHANGE_ENABLED`             | Enable GA4 form change events. Default: `false`                                                           | No              |
| `GA4_NAVIGATION_ENABLED`              | Enable GA4 navigation events. Default: `false`                                                            | No              |
| `GA4_SELECT_CONTENT_ENABLED`          | Enable GA4 select content events. Default: `false`                                                        | No              |
| `MAY_2025_REBRAND_ENABLED`            | Enable GOVUK Frontend rebrand. Default: `false`                                                           | No              |
| `USE_PINO_LOGGER`                     | Use pino JSON logger instead of hmpo-logger.                                                              | No              |

