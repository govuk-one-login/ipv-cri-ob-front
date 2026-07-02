# Browser Test Suite - Comprehensive Coverage Analysis

## Overview

This document outlines the complete browser test coverage for the Open Banking CRI Frontend, including gaps identified and improvements implemented.

## Test Coverage Matrix

### ✅ **Overall Coverage**

#### Pages & Journeys
- **Start page**: Content, interactions, external links, accessibility
- **Choose bank page**: Form validation, dropdown interaction, error handling, bank list contents, successful navigation to consent, offline bank redirect, not-listed link href
- **Consent page**: Checkbox validation, form submission, content verification
- **Language switching**: Welsh translations, cookie persistence
- **Journey tests**: Success flows, prove another way flow, all-banks-offline and bank-list-unavailable (skipped pending `banks.client.ts` API wiring)
- **Error handling**: 404 pages, basic error scenarios
- **Keyboard navigation**: Tab order, focus management
- **Cookie banner**: Basic functionality

#### Routes
```
/sorry-problem-bank           → no standalone route — requires mock journey
/banking-no-match             → no standalone route — requires mock journey
/use-current-account          → no standalone route — requires mock journey
/prove-another-way            → prove-another-way.spec.ts
Session expiry scenarios      → security-validation.spec.ts
```

#### Security & Validation
```
CSRF protection               → security-validation.spec.ts
Session management            → security-validation.spec.ts
Input validation              → security-validation.spec.ts
Security headers              → security-validation.spec.ts
```

#### Mobile & Responsive
```
Touch interactions            → mobile-responsiveness.spec.ts
Viewport adaptability         → mobile-responsiveness.spec.ts
Landscape orientation         → mobile-responsiveness.spec.ts
Touch target sizes            → mobile-responsiveness.spec.ts
```

#### Cross-Browser
```
Form handling consistency     → cross-browser-compatibility.spec.ts
CSS/Layout differences        → cross-browser-compatibility.spec.ts
JavaScript compatibility      → cross-browser-compatibility.spec.ts
Cookie handling               → cross-browser-compatibility.spec.ts
```

#### Performance
```
Page load times               → performance.spec.ts
Resource optimization         → performance.spec.ts
Memory usage                  → performance.spec.ts
Form responsiveness           → performance.spec.ts
Network handling              → performance.spec.ts
```

## Test Configurations

When executing the spec test file using the playwright.local.config.ts, ensure you have run 'npm run dev' in one terminal, before executing the specific test script in a second terminal

### 1. Mock Testing (`playwright.mock.config.ts`)
```bash
npm run test:browser        # run
npm run test:browser:ui     # interactive UI mode
```
- **Devices**: Desktop Chrome, Pixel 5, iPad Pro
- **Tests**: `journeys/mock/**/ob-error.journey.ts`, `journeys/mock/**/ob-success.journey.ts`, `journeys/mock/**/ob-prove-another-way.journey.ts`, `journeys/mock/**/ob-banks-unavailable.journey.ts`
- **Cross-browser subset**: `--project=chromium-desktop --project=chromium-mobile --project=chromium-tablet`

### 2. Mobile Testing (`playwright.mobile.config.ts`)
```bash
npm run test:browser:mobile     # run
npm run test:browser:mobile:ui  # interactive UI mode
```
- **Devices**: iPhone 13
- **Tests**: `specs/mobile-responsiveness.spec.ts`

### 3. Local Testing (`playwright.local.config.ts`)
```bash
npm run test:browser:local              # Chromium (default)
npm run test:browser:local:ui           # interactive UI mode
npm run test:browser:local:firefox      # Firefox
npm run test:browser:local:edge         # Edge
npm run test:browser:local:all          # all browsers
```
- **Browsers**: Chromium, Firefox, Edge (controlled via `BROWSER` env var)
- **Tests**: `specs/**/*.spec.ts`
- **Base URL**: `http://localhost:5090`

### 4. Smoke Testing (`playwright.smoke.config.ts`)
- **Browser**: Chromium
- **Tests**: `specs/**/*.spec.ts`, `journeys/smoke/**/*.journey.ts`
- **Base URL**: `APP_URL` env var (deployed environment)

## Device Coverage Matrix

| Device         | Config             | Viewport   | Touch  |
|----------------|--------------------|------------|--------|
| Desktop Chrome | mock, local, smoke | 1280×720   | ❌     |
| Pixel 5        | mock               | 393×851    | ✅     |
| iPad Pro       | mock               | 1024×1366  | ✅     |
| iPhone 13      | mobile             | 390×844    | ✅     |

## Test Categories

### 🎯 **Functional Tests**
- Start page (`start.spec.ts`)
- Choose bank page (`choose-bank.spec.ts`)
- Consent page (`consent.spec.ts`)
- Prove another way (`prove-another-way.spec.ts`)
- Layout (`layout.spec.ts`)
- Cookie banner (`cookie-banner.spec.ts`)
- Error & failure pages (`error-failure-pages.spec.ts`)
- Language switching (`language.spec.ts`)

### 🔒 **Security Tests**
- CSRF protection
- Session validation
- Input sanitization
- Header security
- (`security-validation.spec.ts`)

### 📱 **Mobile Tests**
- Touch interactions
- Responsive breakpoints
- Viewport adaptability
- Performance on mobile networks
- (`mobile-responsiveness.spec.ts`)

### 🌐 **Cross-Browser Tests**
- JavaScript compatibility
- CSS rendering consistency
- Form behavior uniformity
- Cookie handling
- (`cross-browser-compatibility.spec.ts`)

### ⚡ **Performance Tests**
- Page load times (< 3s target)
- Resource optimization
- Memory leak detection
- Network efficiency
- (`performance.spec.ts`)

### ♿ **Accessibility Tests**
- Keyboard navigation (`keyboard-navigation.spec.ts`)
- Screen reader compatibility
- High contrast mode
- Reduced motion preferences

## Running Tests

### Quick Commands
```bash
# Mock journey tests
npm run test:browser

# Mobile testing
npm run test:browser:mobile

# Cross-browser subset (chromium-desktop, chromium-mobile, chromium-tablet)
npm run test:browser:cross-browser

# Interactive UI mode
npm run test:browser:ui
npm run test:browser:mobile:ui

# Local spec tests
npm run test:browser:local
```

### Test Filtering
```bash
# Run specific test files
npx playwright test mobile-responsiveness.spec.ts

# Run tests by tag
npx playwright test --grep "@mobile"

# Run specific browser
npx playwright test --project=chromium-mobile

# Run with debugging
npx playwright test --debug
```

## Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Page Load | < 3s | performance.spec.ts |
| First Paint | < 1s | performance.spec.ts |
| Form Response | < 500ms | performance.spec.ts |
| Memory Growth | < 10MB | performance.spec.ts |
| CLS Score | < 0.1 | performance.spec.ts |

## Accessibility Compliance

### Standards Covered
- **WCAG 2.1 AA**: Via axe-core integration
- **Keyboard Navigation**: Tab order, focus management
- **Screen Readers**: Semantic HTML, ARIA attributes
- **Visual**: High contrast, reduced motion
- **Touch Targets**: 44px minimum (mobile)

### Testing Tools
- Axe-core automated scanning
- Keyboard-only navigation tests
- High contrast mode validation
- Reduced motion preference testing

## Mobile Testing Strategy

### Touch Interactions
- Tap vs click differentiation
- Swipe gesture handling
- Long press behaviors
- Multi-touch prevention

### Responsive Design
- Breakpoint testing (320px - 1024px)
- Content reflow validation
- Image optimization
- Touch target sizing

### Performance on Mobile
- Slower network simulation
- Limited bandwidth testing
- Battery usage considerations
- Touch response timing

## Error Scenarios Covered

### Application Errors
- 404 Not Found pages
- Session expiry
- Network failures
- Validation errors
- Bank unavailable scenarios — journey tests written in `ob-banks-unavailable.journey.ts`, skipped pending real `/banks` API wiring in `banks.client.ts`

### User Errors
- Missing form data
- Invalid selections
- Navigation mistakes
- Consent withdrawal

### System Errors
- API failures
- Timeout conditions
- Memory constraints
- Cookie issues

## Monitoring and Reporting

### Test Reports
- HTML reports with screenshots
- JUnit XML for CI/CD
- Coverage metrics
- Performance benchmarks

### Failure Analysis
- Automatic screenshots on failure
- Video recordings for debugging
- Network request logs
- Console error capture

## Best Practices Implemented

### Test Stability

#### 1. Wait Strategies (`wait-strategies.ts`)

- **`waitForElement`**: Enhanced element waiting that ensures interactive readiness
- **`navigateAndWait`**: Race-condition-free navigation — registers the URL listener before triggering the action, uses `waitUntil: 'load'` to avoid `networkidle` instability in Vite dev environments
- **`waitWithBackoff`**: Exponential backoff for custom conditions

#### 2. Updated Navigation Helpers

The navigation helpers now use:
- Proper element readiness checks before interaction
- Network idle waiting after navigation
- Increased timeouts for slower operations
- Parallel waiting strategies to avoid race conditions

#### 3. Playwright Configuration

- Timeouts (mock config):
  - `navigationTimeout`: 30s
  - `actionTimeout`: 15s
  - `expect.timeout`: 10s
  - Overall test timeout: 60s
- Screenshots and video retained on failure only
- Trace captured on retry

### Maintainability
- Page Object Model pattern
- Reusable helper functions
- Consistent test structure
- Clear naming conventions

### CI/CD Integration
- Parallel execution
- Artifact retention
- Failure notifications
- Performance monitoring

## Future Enhancements

### Potential Additions
- Visual regression testing
- API contract testing
- Load testing integration
- Advanced security scanning
- Lighthouse performance audits

### Monitoring Expansion
- Real user monitoring (RUM)
- Error tracking integration
- Performance alerting
- Usage analytics

This comprehensive test suite ensures robust coverage across all user journeys, devices, and browsers while maintaining high performance and accessibility standards.
