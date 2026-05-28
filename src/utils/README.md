# Wizard

A session-guard utility for Express journeys. Declares a directed graph of steps, then at request-time enforces the journey topology, tracks history for back-link rendering, and validates that controllers only redirect to declared next-steps.

Some form of session storage must be available for the wizard to save journey state to.

## When to use it

- You have a multistep user journey backed by Express routes.
- You want users to follow the declared path only (no jumping ahead via URL, no backtracking past one-way gates)

## API

```ts
createWizard<S extends WizardSessionSlice>(name: string, steps: WizardSteps<S>): Wizard<S>
```

- `S` is the session shape the wizard reads from. It must include `WizardSessionSlice` (which carries the `wizard?: Record<string, { history: string[] }>` slot the package owns). Supplying `S` is required (likely your applications augmented `SessionData`).
- `name` namespaces the history bucket in the session. Multiple wizards can be created in one app.
- `steps` (`Record<string, WizardStepConfig<S>>`) keyed by Express path.
- Returns `{ name, register, steps }`:
  - `register(router)` installs every step's middleware + guard + controller chain on the supplied Express router.
  - `steps` is the original config exposed as `Readonly`. Diagnostics programs (see `walkWizard`) can use this to provide insight into the loaded topography.
  - `name` is the wizard's name.

### `WizardStepConfig<S>`

| Field        | Type                                                | Purpose                                                                                                                               |
|--------------|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `entryPoint` | `boolean`                                           | Step is a valid first stop when history is empty. At least one is required.                                                           |
| `reset`      | `boolean`                                           | Clears the wizard's history when this step is visited.                                                                                |
| `next`       | `string \| string[]`                                | Declared forward navigation targets. Doubles as the allow-list for controller redirects.                                              |
| `noReturn`   | `boolean`                                           | One-way gate. Once history advances past this step, the user cannot return to it or anything before it.                               |
| `exit`       | `boolean`                                           | Allow the controller to redirect to an absolute URL (e.g. offsite). Relative paths still have to be declared in `next`.               |
| `prereq`     | `{ keys: keyof S & string[]; redirectTo?: string }` | Session-key precondition. If `req.session[key of keys]` is falsy, redirect (to `redirectTo` if provided, otherwise the current head). |
| `middleware` | `RequestHandler[]`                                  | Runs before the guard, not bound by `next`.                                                                                           |
| `controller` | `{ get, post? }`                                    | Standard Express handlers. Redirects are restricted to `next`.                                                                        |

## Behaviour at request time

For each step with a controller, `register(router)` installs:

```ts
router.get(path, ...middleware, guard(path), controller.get)
router.post(path, ...middleware, guard(path), controller.post) // post controllers are optional
```

The guard executes the following in order:

1. If the step is `reset: true`, clears the wizard's history.
2. Checks accessibility against current history. If inaccessible, redirects to the current head (or the first `entryPoint` if history is empty).
3. If the step declares a `prereq` and `req.session[key of keys]` is falsy, redirects to `prereq.redirectTo` (or the current head, if no `redirectTo` is provided).
4. Records the visit:
   - If the path is already in history, truncates back to it (user navigated backwards).
   - Otherwise, pushes onto the end of the history array.
5. Intercepts `res.redirect`. Relative paths must be in the step's `next`; absolute URLs are allowed only if the step is declared `exit: true`.
6. Sets `res.locals.backLink` if there is a previous step in history and accessible, or `null` if there isn't one.
7. Calls `next()`.

### Step accessibility rules

A step is accessible from `history` if any of the following are `true`:

- `history` is empty and the step is an `entryPoint`.
- The step is in the current head's `next` (normal forward navigation).
- The step is already in history, is not behind a `noReturn` barrier, and is not itself a `noReturn` step that has been left behind.

## Examples

### Linear journey

```ts
createWizard<MySessionData>('identity', {
  '/start':       { entryPoint: true, reset: true, next: '/choose-bank', controller: startController },
  '/choose-bank': { next: '/consent', controller: chooseBankController },
  '/consent':     { next: '/sign-in', controller: consentController },
  '/sign-in':     { controller: signInController }
})
```

- `/start` is the only accessible first step.
- After visiting `/start` then `/choose-bank`, history is `['/start', '/choose-bank']`. Both remain reachable via Back link or browser back action.
- `/sign-in` declares no `next` and can't redirect anywhere via the wizard.

### Branching journey

```ts
createWizard<MySessionData>('identity', {
  '/start':            { entryPoint: true, reset: true, next: '/choose-bank',         controller: startController },
  '/choose-bank':      { next: ['/consent', '/bank-unavailable'],                     controller: chooseBankController },
  '/consent':          { next: '/sign-in',                                            controller: consentController },
  '/bank-unavailable': { next: '/choose-bank',                                        controller: bankUnavailableController },
  '/sign-in':          { controller: signInController }
})
```

In this example, `/choose-bank` branches into two paths. Its controller picks based on the chosen bank: `res.redirect('/consent')` if the bank is supported, `res.redirect('/bank-unavailable')` otherwise.

### One-way gates with `noReturn`

```ts
createWizard<MySessionData>('identity', {
  '/start':       { entryPoint: true, reset: true, next: '/choose-bank', controller: startController },
  '/choose-bank': { next: '/consent', controller: chooseBankController },
  '/consent':     { noReturn: true, next: '/sign-in', controller: consentController },
  '/sign-in':     { controller: signInController }
})
```

Once the user has completed `/consent`, they cannot navigate back to `/consent`, `/choose-bank`, or `/start`. If they hit Back from `/sign-in`, the guard redirects them to `/sign-in` (the current head). `res.locals.backLink` on `/sign-in` is `null` because `/consent` is no longer accessible.

### Failure paths and re-entry

```ts
createWizard<MySessionData>('identity', {
  '/start':            { entryPoint: true, reset: true, next: '/choose-bank',          controller: startController },
  '/choose-bank':      { next: ['/consent', '/bank-unavailable'],                      controller: chooseBankController },
  '/consent':          { next: ['/sign-in', '/bank-unavailable'], noReturn: true,      controller: consentController },
  '/bank-unavailable': { next: '/choose-bank', noReturn: true,                         controller: bankUnavailableController },
  '/sign-in':          { controller: signInController }
})
```

In this example, `/bank-unavailable` is a noReturn dead-end branch reachable from both `/choose-bank` and `/consent`. From it the user can only return to `/choose-bank`; history truncates to `['/start', '/choose-bank']` and the journey resumes. Once the user moves past `/bank-unavailable`, it is no longer reachable.

### Multiple entry points

```ts
createWizard<MySessionData>('identity', {
  '/start':       { entryPoint: true, reset: true, next: '/choose-bank', controller: startController },
  '/choose-bank': { next: '/consent',                                    controller: chooseBankController },
  '/consent':     { next: '/sign-in', noReturn: true,                    controller: consentController },
  '/sign-in':     { next: '/check',                                      controller: signInController },
  '/check':       { entryPoint: true, noReturn: true, next: '/result',   controller: checkController },
  '/result':      { controller: resultController }
})
```

In this example, `/check` is a second entry point. You might want more than one entrypoint if the user is redirected back into the journey from an external system (e.g. after an OAuth callback). With empty history, only `/start` or `/check` is directly reachable; any other URL redirects to the first entryPoint.

### Session-key preconditions with `prereq`

```ts
createWizard<MySessionData>('identity', {
  '/start':       { entryPoint: true, reset: true, next: '/choose-bank', controller: startController },
  '/choose-bank': { next: '/consent', controller: chooseBankController },
  '/consent': {
    next: '/sign-in',
    prereq: { keys: 'bankID', redirectTo: '/choose-bank' },
    controller: consentController
  },
  '/sign-in': { controller: signInController }
})
```

In this example, if `req.session.bankID` is unset the guard redirects to `/choose-bank` before the controller runs. `prereq.key` is checked against `keyof MySessionData & string`, so typos are caught at compile time.

If `redirectTo` is omitted the guard falls back to the current head (or the first `entryPoint` when history is empty).

Note that `/choose-bank` is not in `/consent`'s `next` steps. `prereq` and `middleware` are explicitly allowed to redirect outside `next` because they run before the redirect interceptor is installed.

`prereq` is the right option for "this step needs a specific session field set in a previous step".

For anything else use per-step `middleware`, it runs before the guard and is free to redirect anywhere:

```ts
'/consent': {
  next: '/sign-in',
  middleware: [requireFeatureFlag('open-banking')],
  controller: consentController
}
```

### `reset`

```ts
createWizard<MySessionData>('identity', {
  '/start':       { entryPoint: true, reset: true, next: '/choose-bank', controller: startController },
  '/choose-bank': { next: '/consent', controller: chooseBankController },
  '/consent':     { next: '/sign-in', controller: consentController },
  '/sign-in':     { controller: signInController }
})
```

`reset: true` on `/start` clears history every time a user lands there. Combining with `entryPoint: true` gives a clean restart for each attempt. Useful when the journey can be started multiple times on the same session.

## Contract for controllers

- Controllers may call `res.redirect(url)` (or `res.redirect(status, url)`) only with a URL whose pathname (ignoring query string) is in the step's declared `next`.
- If the step declares `exit: true`, the controller may additionally redirect to an absolute `http(s)://` URL (e.g. a third-party handoff whose value is only known at request time).
- Controllers do not need to know the wizard exists

## Contract for middleware

- Per-step middleware may redirect anywhere, the wizard doesn't validate middleware redirects
- Use `prereq` for session-key preconditions, `middleware` for everything else (auth, feature flags, etc)

## Wizard diagram

`walkWizard(wizard, logger)` prints an ASCII diagram of a wizard graph. It's a separate, entirely optional util useful for debugging topographies

Typical usage:

```ts
import { walkWizard } from '@src/utils/dev-tooling/wizard-diagram'

const wizard = createWizard<MySessionData>('identity', { … })
if (LOGGER.isLevelEnabled('debug')) walkWizard(wizard, LOGGER)
```

Example output:

```
identity wizard:
/start [entry, reset]
└── /choose-bank
    ├── /consent [no-return, prereq:bankID]
    │   ├── /sign-in
    │   └── /bank-unavailable [no-return]
    │       └── /choose-bank [↺ seen]
    │       └── /step-with-no-controller [⊘ unreachable]
    └── /bank-unavailable [↺ seen]
```

- `[entry]` (green) marks an `entryPoint` step
- `[reset]` (magenta) marks a step that wipes wizard history on entry
- `[no-return]` marks a `noReturn` step
- `[prereq:<key>]` (orange) marks a step with a `prereq`
- `[⊘ unreachable]` (red) marks a step with no `controller` assigned (declared in the topology but no route is registered for it, so the user can never get there)
- `[↺ seen]` marks a node already rendered higher up
- `[↺ self]` marks a node that can redirect to itself

## Storage

History lives at `req.session.wizard[name].history` as a `string[]`. The `name` argument to `createWizard` namespaces a journey so multiple wizards can exist on one app

## Testing

Behaviour is validated by `test/unit/utils/wizard.test.ts`. When adding new tests, follow the existing patterns
