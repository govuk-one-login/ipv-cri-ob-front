import { type CfnMappings, type EnvironmentKey, ENVIRONMENTS, loadTemplate } from './helpers'
import { describe, expect, it } from 'vitest'

const template = loadTemplate('deploy/template.yml') as Record<string, unknown>
const mappings = template['Mappings'] as CfnMappings

describe('deploy/template.yml — mappings', () => {
  it('has EnvironmentConfiguration, FeatureFlagMapping and ElasticLoadBalancerAccountIds', () => {
    expect(mappings).toHaveProperty('EnvironmentConfiguration')
    expect(mappings).toHaveProperty('FeatureFlagMapping')
    expect(mappings).toHaveProperty('ElasticLoadBalancerAccountIds')
  })

  it.each(ENVIRONMENTS)('EnvironmentConfiguration has entry for %s', (env) => {
    expect(mappings.EnvironmentConfiguration).toHaveProperty(env)
  })

  it.each(ENVIRONMENTS)('EnvironmentConfiguration[%s] has required keys', (env) => {
    const config = mappings.EnvironmentConfiguration[env]
    expect(config).toHaveProperty('logsLevel')
    expect(config).toHaveProperty('dynatraceSecretArn')
    expect(config).toHaveProperty('sessionStoreSecretArn')
    expect(config).toHaveProperty('fargateCPUsize')
    expect(config).toHaveProperty('fargateRAMsize')
    expect(config).toHaveProperty('minECSCount')
    expect(config).toHaveProperty('maxECSCount')
    expect(config).toHaveProperty('nodeEnv')
  })

  it.each(ENVIRONMENTS)(
    'FeatureFlagMapping[%s] has ga4Enabled and deviceIntelligenceEnabled',
    (env) => {
      const flags = mappings.FeatureFlagMapping[env]
      expect(flags).toHaveProperty('ga4Enabled')
      expect(flags).toHaveProperty('deviceIntelligenceEnabled')
    }
  )

  it('ElasticLoadBalancerAccountIds has eu-west-2 AccountId', () => {
    expect(mappings.ElasticLoadBalancerAccountIds['eu-west-2']).toHaveProperty('AccountId')
  })

  it.each(['build', 'production'] as EnvironmentKey[])(
    'EnvironmentConfiguration[%s] has high-capacity Fargate sizing',
    (env) => {
      const config = mappings.EnvironmentConfiguration[env]
      expect(config['fargateCPUsize']).toBe('2048')
      expect(config['fargateRAMsize']).toBe('4096')
    }
  )

  it.each(['dev', 'staging'] as EnvironmentKey[])(
    'EnvironmentConfiguration[%s] has low-capacity Fargate sizing',
    (env) => {
      const config = mappings.EnvironmentConfiguration[env]
      expect(config['fargateCPUsize']).toBe('256')
      expect(config['fargateRAMsize']).toBe('512')
    }
  )
})
