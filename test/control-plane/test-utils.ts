/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Vpc, IVpc, SubnetType, SecurityGroup, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SolutionBucket } from '../../src/common/solution-bucket';
import {
  ApplicationLoadBalancerLambdaPortal,
  ApplicationLoadBalancerProps,
  DomainProps,
  FrontendProps,
  NetworkProps,
} from '../../src/control-plane/alb-lambda-portal';
import { ClickStreamApiConstruct } from '../../src/control-plane/backend/click-stream-api';
import { SolutionNodejsFunction } from '../../src/private/function';
import { TestApp } from '../common/jest';

export interface VPCAttributes {
  vpcId: string;
  availabilityZones: string[];
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export const vpcFromAttr = (
  scope: Construct,
  vpcAttributes: VPCAttributes,
) => {
  return Vpc.fromVpcAttributes(scope, 'testVpc', vpcAttributes);
};

export class TestStack extends Stack {
  public readonly vpc: IVpc;
  public readonly sg: ISecurityGroup;

  constructor(
    scope: Construct,
    id: string,
  ) {
    super(scope, id);

    this.vpc = vpcFromAttr(this, {
      vpcId: 'vpc-11111111111111111',
      availabilityZones: ['test-1a', 'test-1b'],
      publicSubnetIds: ['subnet-11111111111111111', 'subnet-22222222222222222'],
      privateSubnetIds: ['subnet-33333333333333333', 'subnet-44444444444444444'],
    });
    this.sg = new SecurityGroup(this, 'test-sg', {
      vpc: this.vpc,
      allowAllOutbound: false,
    });
  }
}

export interface ApplicationLoadBalancerLambdaPortalTestProps {
  readonly applicationLoadBalancerProps?: ApplicationLoadBalancerProps;
  readonly networkProps?: NetworkProps;
  readonly frontendProps?: FrontendProps;
  readonly domainProps?: DomainProps;
  readonly hasCert?: boolean;
  readonly port?: number;
  readonly externalBucket?: boolean;
  readonly prefix?: string;
  readonly stack?: TestStack;
}

export interface StackElements {
  stack: TestStack;
  portal: ApplicationLoadBalancerLambdaPortal;
}

export interface ApiStackElements {
  stack: TestStack;
  template: Template;
}

export class TestEnv {

  public static newStack(outdir: string) : TestStack {
    return new TestStack(new TestApp(outdir), 'testStack');
  }

  public static newAlbStackWithDefaultPortal(outdir: string) : StackElements {

    const stack = new TestStack(new TestApp(outdir), 'testStack');

    const portal = new ApplicationLoadBalancerLambdaPortal(stack, 'test-portal', {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
      networkProps: {
        vpc: stack.vpc,
        subnets: { subnetType: SubnetType.PUBLIC },
      },
      frontendProps: {
        directory: './',
        dockerfile: 'src/control-plane/frontend/Dockerfile',
        reservedConcurrentExecutions: 3,
      },
    });

    return { stack, portal };
  }

  public static newAlbStackWithPortalProps(outdir: string, props?: ApplicationLoadBalancerLambdaPortalTestProps) : TestStack {

    const stack = props?.stack ?? new TestStack(new TestApp(outdir), 'testStack');

    const bucket = props?.externalBucket ? new SolutionBucket(stack, 'SolutionBucket').bucket : undefined;
    const prefix = props?.prefix ?? undefined;
    const enableAccessLog = props?.applicationLoadBalancerProps?.logProps.enableAccessLog ?? true;

    let applicationLoadBalancerProps: ApplicationLoadBalancerProps;
    if (props?.applicationLoadBalancerProps !== undefined) {
      applicationLoadBalancerProps = {
        internetFacing: props.applicationLoadBalancerProps.internetFacing,
        protocol: props.applicationLoadBalancerProps.protocol,
        idleTimeout: props.applicationLoadBalancerProps.idleTimeout,
        http2Enabled: props.applicationLoadBalancerProps.http2Enabled,
        ipAddressType: props.applicationLoadBalancerProps.ipAddressType,
        healthCheckInterval: props.applicationLoadBalancerProps.healthCheckInterval,
        logProps: {
          enableAccessLog: enableAccessLog,
          bucket: bucket,
          prefix: prefix,
        },
      };
    } else {
      applicationLoadBalancerProps = {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: enableAccessLog,
        },
      };
    }

    const networkProps = props?.networkProps ?? {
      vpc: stack.vpc,
      subnets: { subnetType: props?.applicationLoadBalancerProps?.internetFacing == false ? SubnetType.PRIVATE_WITH_EGRESS : SubnetType.PUBLIC },
      port: props?.port,
    };
    const frontendProps = props?.frontendProps ?? {
      directory: './',
      dockerfile: 'src/control-plane/frontend/Dockerfile',
    };

    new ApplicationLoadBalancerLambdaPortal(stack, 'test-portal', {
      applicationLoadBalancerProps: applicationLoadBalancerProps,
      networkProps: networkProps,
      frontendProps: frontendProps,
    });

    return stack;
  }

  public static newAlbStackWithPortalPropsAndCustomDomain(outdir: string, props?: ApplicationLoadBalancerLambdaPortalTestProps) : TestStack {

    const stack = new TestStack(new TestApp(outdir), 'testStack');

    const applicationLoadBalancerProps = props?.applicationLoadBalancerProps ?? {
      internetFacing: true,
      protocol: ApplicationProtocol.HTTP,
      logProps: {
        enableAccessLog: true,
      },
    };

    const networkProps = props?.networkProps ?? {
      vpc: stack.vpc,
      subnets: { subnetType: SubnetType.PUBLIC },
      port: props?.port,
    };
    const frontendProps = props?.frontendProps ?? {
      directory: './',
      dockerfile: 'src/control-plane/frontend/Dockerfile',
    };

    const testHostedZone = new HostedZone(stack, 'HostedZone', {
      zoneName: 'example.com',
    });

    let domainProps: DomainProps;
    if (props?.hasCert) {
      const certificate = new Certificate(stack, 'Certificate', {
        domainName: 'test.example.com',
        validation: CertificateValidation.fromDns(testHostedZone),
      });

      domainProps = {
        hostedZoneName: 'example.com',
        recordName: 'test011',
        hostedZone: testHostedZone,
        certificate: certificate,
      };
    } else {
      domainProps = {
        hostedZoneName: 'example.com',
        recordName: 'test011',
        hostedZone: testHostedZone,
      };
    }

    new ApplicationLoadBalancerLambdaPortal(stack, 'test-portal', {
      applicationLoadBalancerProps: applicationLoadBalancerProps,
      networkProps: networkProps,
      frontendProps: frontendProps,
      domainProps: domainProps,
    });

    return stack;
  }

  public static newALBApiStack(outdir: string, cn: boolean = false): ApiStackElements {

    const stack = new TestStack(new TestApp(outdir), 'apiTestStack');
    const s3Bucket = new Bucket(stack, 'stackWorkflowS3Bucket');

    const pluginPrefix = 'plugins/';
    new ClickStreamApiConstruct(stack, 'testClickStreamALBApi', {
      fronting: 'alb',
      applicationLoadBalancer: {
        vpc: stack.vpc,
        subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        securityGroup: stack.sg,
      },
      targetToCNRegions: cn,
      stackWorkflowS3Bucket: s3Bucket,
      pluginPrefix,
      healthCheckPath: '/',
      adminUserEmail: 'fake@example.com',
      iamRolePrefix: '',
      iamRoleBoundaryArn: '',
      conditionStringRolePrefix: 'Clickstream',
      conditionStringStackPrefix: 'Clickstream',
    });

    const template = Template.fromStack(stack);
    return { stack, template };
  }

  public static newALBWithRolePrefixApiStack(outdir: string): ApiStackElements {

    const stack = new TestStack(new TestApp(outdir), 'apiTestStack');
    const s3Bucket = new Bucket(stack, 'stackWorkflowS3Bucket');

    const pluginPrefix = 'plugins/';
    new ClickStreamApiConstruct(stack, 'testClickStreamALBApi', {
      fronting: 'alb',
      applicationLoadBalancer: {
        vpc: stack.vpc,
        subnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        securityGroup: stack.sg,
      },
      targetToCNRegions: false,
      stackWorkflowS3Bucket: s3Bucket,
      pluginPrefix,
      healthCheckPath: '/',
      adminUserEmail: 'fake@example.com',
      iamRolePrefix: 'testRolePrefix',
      iamRoleBoundaryArn: 'arn:aws:iam::555555555555:policy/test-boundary-policy',
      conditionStringRolePrefix: 'testRolePrefix',
      conditionStringStackPrefix: 'testRolePrefix-Clickstream',
    });

    const template = Template.fromStack(stack);
    return { stack, template };
  }

  public static newCloudfrontApiStack(outdir: string, cn: boolean = false): ApiStackElements {

    const stack = new TestStack(new TestApp(outdir), 'apiTestStack');
    const s3Bucket = new Bucket(stack, 'stackWorkflowS3Bucket');

    const authFunction = new SolutionNodejsFunction(stack, 'AuthorizerFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: './src/control-plane/auth/index.ts',
      environment: {
        ISSUER: 'https://idp.example.com/GF13ivtJ2',
      },
      reservedConcurrentExecutions: 3,
    });

    const authorizer = new TokenAuthorizer(stack, 'JWTAuthorizer', {
      handler: authFunction,
      validationRegex: '^(Bearer )[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)$',
    });

    const pluginPrefix = 'plugins/';
    new ClickStreamApiConstruct(stack, 'testClickStreamCloudfrontApi', {
      fronting: 'cloudfront',
      apiGateway: {
        stageName: 'api',
        authorizer: authorizer,
      },
      targetToCNRegions: cn,
      stackWorkflowS3Bucket: s3Bucket,
      pluginPrefix,
      healthCheckPath: '/',
      adminUserEmail: 'fake@example.com',
      iamRolePrefix: '',
      iamRoleBoundaryArn: '',
      conditionStringRolePrefix: 'Clickstream',
      conditionStringStackPrefix: 'Clickstream',
    });

    const template = Template.fromStack(stack);
    return { stack, template };
  }

}

export function findResources(template: Template, type: string) {
  const resources: any[] = [];
  const allResources = template.toJSON().Resources;
  for (const key of Object.keys(allResources)) {
    const r = allResources[key];
    if (r.Type == type) {
      resources.push(r);
    }
  }
  return resources;
}

export function findResourcesName(template: Template, type: string) {
  const resources: any[] = [];
  const allResources = template.toJSON().Resources;
  for (const key of Object.keys(allResources)) {
    const r = allResources[key];
    if (r.Type == type) {
      resources.push(key);
    }
  }
  return resources;
}

export function findResourceByKeyAndType(template: Template, inputKey: string, type: String) {
  const allResources = template.toJSON().Resources;
  for (const key of Object.keys(allResources)) {
    if (key.startsWith(inputKey) && allResources[key].Type == type) {
      return allResources[key];
    }
  }
  return undefined;
}