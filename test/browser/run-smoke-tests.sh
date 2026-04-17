#!/usr/bin/env bash

set -euo pipefail

STACK_NAME="${CFN_StackName:-${SAM_STACK_NAME:-local}}"
ENVIRONMENT="${ENVIRONMENT:-${TEST_ENVIRONMENT:-build}}"

echo "ENVIRONMENT: ${ENVIRONMENT}"
echo "STACK_NAME: ${STACK_NAME}"

if [[ "${STACK_NAME}" != "local" ]]; then
  echo "Fetching test configuration from SSM..."

  APP_URL=$(aws ssm get-parameter \
    --name "/tests/${STACK_NAME}/appUrl" \
    --region eu-west-2 \
    --query "Parameter.Value" \
    --output text)

  export APP_URL
fi

npx playwright test --config playwright.smoke.config.ts
