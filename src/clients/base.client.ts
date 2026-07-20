import type { RawAxiosRequestHeaders } from 'axios'
import type { Request } from 'express'

const createBaseClient = (req: Request) => ({
  get: <TResponse>(path: string, headers: RawAxiosRequestHeaders = {}): Promise<TResponse> =>
    req.axios
      .get<TResponse>(path, {
        headers: {
          ...headers,
          session_id: req.session.tokenId
        }
      })
      .then((res) => res.data),
  post: <TBody, TResponse>(
    path: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> =>
    req.axios
      .post<TResponse>(path, body, {
        headers: {
          ...headers,
          session_id: req.session.tokenId
        }
      })
      .then((res) => res.data),
  stub: <TResponse>(data: TResponse): Promise<TResponse> => Promise.resolve(data)
})

export { createBaseClient }
