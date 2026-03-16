export interface OverloadProtectionConfig {
  clientRetrySecs?: number
  errorPropagationMode?: boolean
  logging?: ((data: unknown) => void) | false | string
  logStatsOnReq?: boolean
  maxEventLoopDelay?: number
  maxHeapUsedBytes?: number
  maxRssBytes?: number
  production?: boolean
  sampleInterval?: number
}

export default {
  maxEventLoopDelay: 500
} satisfies OverloadProtectionConfig
