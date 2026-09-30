import { Sha256 } from '@aws-crypto/sha256-js'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { SignatureV4 } from '@smithy/signature-v4'

const getTestHarnessExecuteUrl = (): string => {
  const url = process.env['TEST_HARNESS_URL']
  if (!url) throw new Error('TEST_HARNESS_URL is not set')
  return url
}

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: 'eu-west-2',
  service: 'execute-api',
  sha256: Sha256
})

export interface TestHarnessOverrides {
  client_id?: string
  evidence_requested?: Record<string, unknown>
  shared_claims?: Record<string, unknown>
}

export const getSessionJwt = async (
  overrides?: TestHarnessOverrides
): Promise<{ client_id: string; request: string }> => {
  const startFunctionUrl = new URL('start', getTestHarnessExecuteUrl())
  const body = JSON.stringify(overrides ?? {})

  const signed = await signer.sign({
    method: 'POST',
    hostname: startFunctionUrl.hostname,
    path: startFunctionUrl.pathname,
    protocol: startFunctionUrl.protocol,
    headers: {
      'Content-Type': 'application/json',
      host: startFunctionUrl.hostname
    },
    body
  })

  const res = await fetch(startFunctionUrl.toString(), {
    body,
    headers: signed.headers as Record<string, string>,
    method: 'POST'
  })

  if (!res.ok) throw new Error(`TestHarnessExecute /start failed: ${res.status}`)
  return await res.json()
}
