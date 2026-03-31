import {
  type ApiGwResource,
  type ApiGwRouteResource,
  type ConditionalResource,
  type DynamoDBTableResource,
  type ECSClusterResource,
  type ECSServiceTaskDefinitionResource,
  EXPECTED_RESOURCES,
  type KmsKeyResource,
  type LoadBalancerResource,
  loadTemplate,
  type LogGroupResource,
  type S3BucketResource,
  type SecurityGroupIngressResource,
  type SecurityGroupResource
} from './helpers'
import { describe, expect, it } from 'vitest'

const template = loadTemplate('deploy/template.yml') as Record<string, unknown>
const resources = template['Resources'] as Record<string, unknown>

const accessLogsBucket = resources['AccessLogsBucket'] as ConditionalResource & S3BucketResource
const loadBalancer = resources['LoadBalancer'] as LoadBalancerResource
const ecsTaskDef = resources['ECSServiceTaskDefinition'] as ECSServiceTaskDefinitionResource
const ecsAccessLogsGroup = resources['ECSAccessLogsGroup'] as LogGroupResource
const apiGwAccessLogsGroup = resources['APIGatewayAccessLogsGroup'] as LogGroupResource
const sessionsTable = resources['SessionsTable'] as DynamoDBTableResource
const loadBalancerSG = resources['LoadBalancerSG'] as SecurityGroupResource
const ecsSecurityGroupIngress = resources[
  'ECSSecurityGroupIngressFromLoadBalancer'
] as SecurityGroupIngressResource
const apiGwEndpoint = resources['APIGatewayHTTPEndpoint'] as ApiGwResource
const apiGwRoute = resources['APIGatewayRoute'] as ApiGwRouteResource
const ecsCluster = resources['EcsCluster'] as ECSClusterResource
const loggingKmsKey = resources['LoggingKmsKey'] as KmsKeyResource

describe('deploy/template.yml — resources', () => {
  it.each(EXPECTED_RESOURCES)('has resource %s', (name) => {
    expect(resources).toHaveProperty(name)
  })

  it.each(EXPECTED_RESOURCES)('resource %s has a valid AWS Type', (name) => {
    const resource = resources[name] as { Type: string }
    expect(resource.Type).toMatch(/^AWS::/)
  })

  it('AccessLogsBucket is conditional on IsNotDevelopment', () => {
    expect(accessLogsBucket.Condition).toBe('IsNotDevelopment')
  })

  it('AccessLogsBucketPolicy is conditional on IsNotDevelopment', () => {
    const resource = resources['AccessLogsBucketPolicy'] as ConditionalResource
    expect(resource.Condition).toBe('IsNotDevelopment')
  })

  it('Alb5xxRateCanaryErrorAlarm is conditional on UseCanaryDeployment', () => {
    const resource = resources['Alb5xxRateCanaryErrorAlarm'] as ConditionalResource
    expect(resource.Condition).toBe('UseCanaryDeployment')
  })

  it('ECSCanaryDeploymentStack is conditional on UseCanaryDeployment', () => {
    const resource = resources['ECSCanaryDeploymentStack'] as ConditionalResource
    expect(resource.Condition).toBe('UseCanaryDeployment')
  })

  it('LoadBalancer is internal scheme', () => {
    expect(loadBalancer.Properties.Scheme).toBe('internal')
  })

  it('LoadBalancer is application type', () => {
    expect(loadBalancer.Properties.Type).toBe('application')
  })

  it('ECSServiceTaskDefinition uses FARGATE compatibility', () => {
    expect(ecsTaskDef.Properties.RequiresCompatibilities).toContain('FARGATE')
  })

  it('ECSServiceTaskDefinition uses awsvpc network mode', () => {
    expect(ecsTaskDef.Properties.NetworkMode).toBe('awsvpc')
  })

  it('ECSServiceTaskDefinition container uses readonly root filesystem', () => {
    const container = ecsTaskDef.Properties.ContainerDefinitions[0] as {
      ReadonlyRootFilesystem: boolean
    }
    expect(container.ReadonlyRootFilesystem).toBe(true)
  })

  it('ECSServiceTaskDefinition container exposes port 5090', () => {
    const container = ecsTaskDef.Properties.ContainerDefinitions[0] as {
      PortMappings: { ContainerPort: number }[]
    }
    const portMapping = container.PortMappings[0] as { ContainerPort: number }
    expect(portMapping.ContainerPort).toBe(5090)
  })

  it('ECSAccessLogsGroup has RetentionInDays set', () => {
    expect(ecsAccessLogsGroup.Properties.RetentionInDays).toBeDefined()
  })

  it('APIGWAccessLogsGroup has RetentionInDays set', () => {
    expect(apiGwAccessLogsGroup.Properties.RetentionInDays).toBeDefined()
  })

  it('SessionsTable uses PAY_PER_REQUEST billing', () => {
    expect(sessionsTable.Properties.BillingMode).toBe('PAY_PER_REQUEST')
  })

  it("SessionsTable has TTL enabled on 'expires' attribute", () => {
    expect(sessionsTable.Properties.TimeToLiveSpecification.AttributeName).toBe('expires')
    expect(sessionsTable.Properties.TimeToLiveSpecification.Enabled).toBe(true)
  })

  it('SessionsTable has SSE enabled', () => {
    expect(sessionsTable.Properties.SSESpecification.SSEEnabled).toBe(true)
  })

  it('LoadBalancerSG allows ingress on port 80', () => {
    const ingress = loadBalancerSG.Properties.SecurityGroupIngress[0] as {
      FromPort: number
      ToPort: number
    }
    expect(ingress.FromPort).toBe(80)
    expect(ingress.ToPort).toBe(80)
  })

  it('ECSSecurityGroupIngressFromLoadBalancer allows ingress on port 5090', () => {
    expect(ecsSecurityGroupIngress.Properties.FromPort).toBe(5090)
    expect(ecsSecurityGroupIngress.Properties.ToPort).toBe(5090)
  })

  it('ApiGwHttpEndpoint uses HTTP protocol', () => {
    expect(apiGwEndpoint.Properties.ProtocolType).toBe('HTTP')
  })

  it('APIGWRoute uses ANY proxy route key', () => {
    expect(apiGwRoute.Properties.RouteKey).toBe('ANY /{proxy+}')
  })

  it('EcsCluster has containerInsights enabled', () => {
    const setting = ecsCluster.Properties.ClusterSettings.find(
      (s) => s.Name === 'containerInsights'
    )
    expect(setting?.Value).toBe('enabled')
  })

  it('LoggingKmsKey has key rotation enabled', () => {
    expect(loggingKmsKey.Properties.EnableKeyRotation).toBe(true)
  })

  it('AccessLogsBucket has versioning enabled', () => {
    expect(accessLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled')
  })

  it('AccessLogsBucket blocks all public access', () => {
    const config = accessLogsBucket.Properties.PublicAccessBlockConfiguration
    expect(config.BlockPublicAcls).toBe(true)
    expect(config.BlockPublicPolicy).toBe(true)
    expect(config.IgnorePublicAcls).toBe(true)
    expect(config.RestrictPublicBuckets).toBe(true)
  })
})
