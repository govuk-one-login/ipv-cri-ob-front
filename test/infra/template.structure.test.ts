import {
  CfnOutputSchema,
  type CfnParameter,
  CfnParameterSchema,
  ENVIRONMENTS,
  loadTemplate
} from './helpers'
import { describe, expect, it } from 'vitest'

const template = loadTemplate('deploy/template.yml') as Record<string, unknown>
const parameters = template['Parameters'] as Record<string, CfnParameter>

describe('deploy/template.yml — structure', () => {
  it('has required top-level keys', () => {
    expect(template).toHaveProperty('AWSTemplateFormatVersion')
    expect(template).toHaveProperty('Description')
    expect(template).toHaveProperty('Parameters')
    expect(template).toHaveProperty('Conditions')
    expect(template).toHaveProperty('Mappings')
    expect(template).toHaveProperty('Resources')
    expect(template).toHaveProperty('Outputs')
  })

  it('has the SAM transform', () => {
    expect(template['Transform']).toContain('AWS::Serverless-2016-10-31')
  })
})

describe('deploy/template.yml — parameters', () => {
  it.each([
    'Environment',
    'VpcStackName',
    'PermissionsBoundary',
    'CodeSigningConfigArn',
    'DeploymentStrategy',
    'LogGroupRetentionInDays'
  ])('has parameter %s conforming to CFN schema', (name) => {
    expect(() => CfnParameterSchema.parse(parameters[name])).not.toThrow()
  })

  it('Environment has AllowedPattern covering all environments', () => {
    const pattern = new RegExp(parameters['Environment']!.AllowedPattern!)
    for (const e of ENVIRONMENTS) {
      expect(pattern.test(e), `pattern should match '${e}'`).toBe(true)
    }
  })

  it('LogGroupRetentionInDays defaults to 30', () => {
    expect(parameters['LogGroupRetentionInDays']!.Default).toBe('30')
  })

  it("PermissionsBoundary defaults to 'none'", () => {
    expect(parameters['PermissionsBoundary']!.Default).toBe('none')
  })

  it("CodeSigningConfigArn defaults to 'none'", () => {
    expect(parameters['CodeSigningConfigArn']!.Default).toBe('none')
  })
})

describe('deploy/template.yml — conditions', () => {
  const conditions = template['Conditions'] as Record<string, unknown>

  it.each([
    'IsNotDevelopment',
    'IsProduction',
    'UsePermissionsBoundary',
    'UseCodeSigning',
    'UseCanaryDeployment'
  ])('has condition %s', (name) => {
    expect(conditions).toHaveProperty(name)
  })
})

describe('deploy/template.yml — outputs', () => {
  const outputs = template['Outputs'] as Record<string, unknown>

  it.each(['URL', 'APIGatewayID'])('has output %s', (name) => {
    expect(outputs).toHaveProperty(name)
  })

  it.each(['URL', 'APIGatewayID'])('output %s conforms to CFN schema', (name) => {
    expect(() => CfnOutputSchema.parse(outputs[name])).not.toThrow()
  })

  it('APIGatewayID is exported', () => {
    const output = outputs['APIGatewayID'] as { Export: unknown }
    expect(output.Export).toBeDefined()
  })
})
