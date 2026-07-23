#!/usr/bin/env bash

# this script runs in the smoke tests container

set -euo pipefail

STACK_NAME="${CFN_StackName:-${SAM_STACK_NAME:-local}}"
ENVIRONMENT="${ENVIRONMENT:-${TEST_ENVIRONMENT:-build}}"

echo "ENVIRONMENT: ${ENVIRONMENT}"
echo "STACK_NAME: ${STACK_NAME}"

APP_URL="https://review-ob.${ENVIRONMENT}.account.gov.uk"
CORE_STUB_URL="https://test-resources.review-ob.${ENVIRONMENT}.account.gov.uk"

export APP_URL
export CORE_STUB_URL

cd /app/test/browser
npx playwright test --config playwright.smoke.config.ts
