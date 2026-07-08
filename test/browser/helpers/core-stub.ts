import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { SignatureV4 } from '@smithy/signature-v4'
import { createHash, createHmac } from 'node:crypto'

import dotenv from 'dotenv'

dotenv.config()

const getCoreStubUrl = (): string => {
  const url = process.env['CORE_STUB_URL']
  if (!url) throw new Error('CORE_STUB_URL is not set')
  return url
}

class NodeSha256 {
  private readonly hash: ReturnType<typeof createHash> | ReturnType<typeof createHmac>
  constructor(secret?: ArrayBuffer | ArrayBufferView | string) {
    this.hash = secret
      ? createHmac('sha256', Buffer.from(secret as ArrayBuffer))
      : createHash('sha256')
  }
  digest() {
    return Promise.resolve(new Uint8Array(this.hash.digest()))
  }
  update(data: ArrayBuffer | ArrayBufferView | string) {
    this.hash.update(Buffer.from(data as ArrayBuffer))
  }
}

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: 'eu-west-2',
  service: 'execute-api',
  sha256: NodeSha256
})

export const getSessionJwt = async (
  sharedClaims?: Record<string, unknown>
): Promise<{ client_id: string; request: string }> => {
  const url = new URL(`${getCoreStubUrl()}/start`)
  const body = JSON.stringify(sharedClaims ? { shared_claims: sharedClaims } : {})

  const signed = await signer.sign({
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname,
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    body
  })

  const res = await fetch(url.toString(), {
    body,
    headers: signed.headers as Record<string, string>,
    method: 'POST'
  })

  if (!res.ok) throw new Error(`Headless stub /start failed: ${res.status}`)
  return res.json() as Promise<{ client_id: string; request: string }>
}
