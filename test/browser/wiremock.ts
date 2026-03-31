interface WireMockMapping {
  request: {
    bodyPatterns?: Record<string, unknown>[]
    headers?: Record<string, Record<string, unknown>>
    method: string
    url?: string
    urlPath?: string
  }
  response: {
    body?: string
    headers?: Record<string, string>
    jsonBody?: Record<string, unknown>
    status: number
    transformers?: string[]
  }
}

interface WireMockRequest {
  body: string
  headers: Record<string, string>
  method: string
  url: string
}

const getWiremockUrl = (): string => {
  const wiremockUrl = process.env['WIREMOCK_URL']
  if (!wiremockUrl) throw new Error('WIREMOCK_URL is not set')
  return wiremockUrl
}

const BASE_URL = getWiremockUrl()

export const wiremock = {
  addMapping: async (mapping: WireMockMapping) => {
    const res = await fetch(`${BASE_URL}/__admin/mappings`, {
      body: JSON.stringify(mapping),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to add mapping: ${res.status}`)
  },
  getRequest: async (urlPath: string, method = 'GET'): Promise<WireMockRequest> => {
    const requests = await wiremock.getRequests(urlPath, method)
    const request = requests[0]
    if (!request) throw new Error(`Expected a ${method} request to ${urlPath}, but none were found`)
    return request
  },
  getRequests: async (urlPath: string, method = 'GET'): Promise<WireMockRequest[]> => {
    const res = await fetch(`${BASE_URL}/__admin/requests/find`, {
      body: JSON.stringify({ method, urlPath }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to find requests: ${res.status}`)
    const data = (await res.json()) as { requests: WireMockRequest[] }
    return data.requests
  },
  // Not currently used, if addMapping is used in any test, this will need to be added to the beforeEach for that test
  reset: async () => {
    const res = await fetch(`${BASE_URL}/__admin/mappings/reset`, { method: 'POST' })
    if (!res.ok) throw new Error(`Failed to reset mappings: ${res.status}`)
  },
  resetRequests: async () => {
    const res = await fetch(`${BASE_URL}/__admin/requests`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to reset requests: ${res.status}`)
  },
  resetScenarios: async () => {
    const res = await fetch(`${BASE_URL}/__admin/scenarios/reset`, { method: 'POST' })
    if (!res.ok) throw new Error(`Failed to reset scenarios: ${res.status}`)
  },
  verify: async (urlPath: string, method = 'GET', expectedCount = 1) => {
    const res = await fetch(`${BASE_URL}/__admin/requests/count`, {
      body: JSON.stringify({ method, urlPath }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to count requests: ${res.status}`)
    const { count } = (await res.json()) as { count: number }
    if (count !== expectedCount)
      throw new Error(
        `Expected ${expectedCount} ${method} request(s) to ${urlPath}, but received ${count}`
      )
  }
}
