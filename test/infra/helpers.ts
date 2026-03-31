import { readFileSync } from 'fs'
import { resolve } from 'path'
import { z } from 'zod'

import yaml from 'js-yaml'

const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(
  [
    '!And',
    '!Base64',
    '!Cidr',
    '!Condition',
    '!Equals',
    '!FindInMap',
    '!GetAtt',
    '!GetAZs',
    '!If',
    '!ImportValue',
    '!Join',
    '!Not',
    '!Or',
    '!Ref',
    '!Select',
    '!Split',
    '!Sub',
    '!Transform',
    '!ValueOf'
  ].flatMap((tag) => [
    new yaml.Type(tag, { construct: (d: unknown) => ({ [tag]: d }), kind: 'scalar' }),
    new yaml.Type(tag, { construct: (d: unknown) => ({ [tag]: d }), kind: 'sequence' }),
    new yaml.Type(tag, { construct: (d: unknown) => ({ [tag]: d }), kind: 'mapping' })
  ])
)

export function loadTemplate(relativePath: string): unknown {
  const content = readFileSync(resolve(process.cwd(), relativePath), 'utf8')
  return yaml.load(content, { schema: CFN_SCHEMA })
}

// Shared fixtures
export const ENVIRONMENTS = ['dev', 'build', 'staging', 'integration', 'production'] as const

export const EXPECTED_RESOURCES = [
  'LoggingKmsKey',
  'LoadBalancerSG',
  'LoadBalancerSGEgressToECSSecurityGroup',
  'ECSSecurityGroup',
  'ECSSecurityGroupIngressFromLoadBalancer',
  'AccessLogsBucket',
  'AccessLogsBucketPolicy',
  'LoadBalancer',
  'LoadBalancerListenerTargetGroupECS',
  'LoadBalancerListenerGreenTargetGroupECS',
  'LoadBalancerListener',
  'CloudFrontWAFv2ACLAssociation',
  'EcsCluster',
  'EcsService',
  'ECSAccessLogsGroup',
  'ECSServiceTaskDefinition',
  'ECSTaskExecutionRole',
  'ECSTaskRole',
  'APIGatewayHTTPEndpoint',
  'APIGatewayHTTPEndpointIntegration',
  'APIGatewayRoute',
  'APIGatewayStageDefault',
  'APIGatewayAccessLogsGroup',
  'SessionsTable',
  'ECSAutoScalingTarget',
  'ECSPredictiveScalingPolicy',
  'EcsStepScaleOutPolicy',
  'EcsStepScaleInPolicy',
  'EcsScaleOutAlarm',
  'EcsScaleInAlarm',
  'EcsNoTaskCountErrorCriticalAlarm',
  'EcsMinTaskCountErrorWarningAlarm',
  'Alb5xxCountErrorWarningAlarm',
  'Alb5xxRateErrorCriticalAlarm',
  'Alb5xxRateCanaryErrorAlarm',
  'EventLoopDelayMetricFilter',
  'EventLoopUtilizationIdleMetricFilter',
  'EventLoopUtilizationActiveMetricFilter',
  'EventLoopUtilizationUtilizationMetricFilter',
  'RequestsPerSecondMetricFilter',
  'AvgResponseTimeMetricFilter',
  'MaxConcurrentConnectionsMetricFilter'
] as const

// Zod schemas
export const CfnParameterSchema = z.object({
  AllowedPattern: z.string().optional(),
  AllowedValues: z.array(z.string()).optional(),
  Default: z.union([z.string(), z.number()]).optional(),
  Description: z.string().optional(),
  Type: z.string()
})

export const CfnOutputSchema = z.object({
  Description: z.string().optional(),
  Export: z
    .object({
      Name: z.unknown()
    })
    .optional(),
  Value: z.unknown()
})

export const CfnResourceSchema = z.object({
  Condition: z.string().optional(),
  DependsOn: z.union([z.string(), z.array(z.string())]).optional(),
  Properties: z.record(z.string(), z.unknown()).optional(),
  Type: z.string().regex(/^AWS::/)
})

export const CfnTemplateSchema = z.object({
  AWSTemplateFormatVersion: z.string(),
  Conditions: z.record(z.string(), z.unknown()),
  Description: z.string(),
  Mappings: z.record(z.string(), z.record(z.string(), z.record(z.string(), z.unknown()))),
  Outputs: z.record(z.string(), CfnOutputSchema).optional(),
  Parameters: z.record(z.string(), CfnParameterSchema),
  Resources: z.record(z.string(), CfnResourceSchema)
})

export interface ApiGwResource {
  Properties: { ProtocolType: string }
}

export interface ApiGwRouteResource {
  Properties: { RouteKey: string }
}

export interface CfnMappings {
  ElasticLoadBalancerAccountIds: Record<string, Record<string, unknown>>
  EnvironmentConfiguration: EnvConfig
  FeatureFlagMapping: EnvConfig
}

// Inferred types
export type CfnParameter = z.infer<typeof CfnParameterSchema>

export interface ConditionalResource {
  Condition: string
}

export interface DynamoDBTableResource {
  Properties: {
    BillingMode: string
    SSESpecification: { SSEEnabled: boolean }
    TimeToLiveSpecification: { AttributeName: string; Enabled: boolean }
  }
}

export interface ECSClusterResource {
  Properties: { ClusterSettings: { Name: string; Value: string }[] }
}

export interface ECSServiceTaskDefinitionResource {
  Properties: {
    ContainerDefinitions: {
      PortMappings: { ContainerPort: number }[]
      ReadonlyRootFilesystem: boolean
    }[]
    NetworkMode: string
    RequiresCompatibilities: string[]
  }
}

export type EnvConfig = Record<EnvironmentKey, Record<string, unknown>> &
  Record<string, Record<string, unknown>>

export type EnvironmentKey = (typeof ENVIRONMENTS)[number]

export interface KmsKeyResource {
  Properties: { EnableKeyRotation: boolean }
}

// Resource property types
export interface LoadBalancerResource {
  Properties: { Scheme: string; Type: string }
}

export interface LogGroupResource {
  Properties: { RetentionInDays: unknown }
}

export interface S3BucketResource {
  Properties: {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: boolean
      BlockPublicPolicy: boolean
      IgnorePublicAcls: boolean
      RestrictPublicBuckets: boolean
    }
    VersioningConfiguration: { Status: string }
  }
}

export interface SecurityGroupIngressResource {
  Properties: { FromPort: number; ToPort: number }
}

export interface SecurityGroupResource {
  Properties: {
    SecurityGroupIngress: { FromPort: number; ToPort: number }[]
  }
}
