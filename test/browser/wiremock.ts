const url = () => {
  const wiremockUrl = process.env['WIREMOCK_URL']
  if (!wiremockUrl) throw new Error('WIREMOCK_URL is not set')
  return wiremockUrl
}

export const wiremock = {
  resetScenarios: async () => {
    const res = await fetch(`${url()}/__admin/scenarios/reset`, { method: 'POST' })
    if (!res.ok) throw new Error(`Failed to reset scenarios: ${res.status}`)
  }
}
