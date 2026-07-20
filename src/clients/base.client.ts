import type { Request } from 'express'

const createBaseClient = (req: Request) => {
  const sessionHeader = req.session.tokenId ? { session_id: req.session.tokenId } : {}

  return {
    get: (path: string, headers: Record<string, string> = {}): Promise<Response> =>
      req.customFetch(path, {
        method: 'GET',
        headers: { ...headers, ...sessionHeader }
      }),

    post: (path: string, body: BodyInit, headers: Record<string, string> = {}): Promise<Response> =>
      req.customFetch(path, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...sessionHeader
        }
      })
  }
}

export { createBaseClient }
