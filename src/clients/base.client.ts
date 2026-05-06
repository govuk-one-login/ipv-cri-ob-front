import type { AxiosInstance, RawAxiosRequestHeaders } from 'axios'

const createBaseClient = (axios: AxiosInstance) => ({
  get: <TResponse>(path: string): Promise<TResponse> =>
    axios.get<TResponse>(path).then((res) => res.data),
  post: <TBody, TResponse>(path: string, body: TBody): Promise<TResponse> =>
    axios.post<TResponse>(path, body).then((res) => res.data),
  postWithHeaders: <TBody, TResponse>(
    path: string,
    body: TBody,
    headers: RawAxiosRequestHeaders
  ): Promise<TResponse> => axios.post<TResponse>(path, body, { headers }).then((res) => res.data),
  stub: <TResponse>(data: TResponse): Promise<TResponse> => Promise.resolve(data)
})

export { createBaseClient }
