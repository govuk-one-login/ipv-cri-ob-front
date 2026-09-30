export interface ConsentsRequest {
  bank_id: string
  return_url: string
}

export interface ConsentsResponse {
  cached?: boolean
  id: string
  url: string
  urlExpiresAtSeconds: number
}
