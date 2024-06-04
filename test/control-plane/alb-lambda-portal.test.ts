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

import {
  Duration,
} from 'aws-cdk-lib';
import {
  Template,
  Match,
} from 'aws-cdk-lib/assertions';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { ApplicationProtocol, IpAddressType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Function, Runtime, InlineCode } from 'aws-cdk-lib/aws-lambda';
import { TestEnv, TestStack, findResourcesName, findResources } from './test-utils';
import { Constant } from '../../src/control-plane/private/constant';
import { TestApp, removeFolder } from '../common/jest';

if (process.env.CI !== 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => require('../cdk-lambda-nodejs-mock'));
}

describe('ApplicationLoadBalancerLambdaPortal', () => {

  afterAll(() => {
    removeFolder(cdkOut);
  });

  const cdkOut = '/tmp/alb-lambda-portal-test';

  test('Invalid subnet selection', () => {
    const stack = new TestStack(new TestApp(cdkOut), 'testStack');
    expect(() => {
      TestEnv.newAlbStackWithPortalProps(cdkOut, {
        applicationLoadBalancerProps: {
          internetFacing: false,
          protocol: ApplicationProtocol.HTTP,
          logProps: {
            enableAccessLog: true,
          },
        },
        networkProps: {
          vpc: stack.vpc,
          subnets: { subnetType: SubnetType.PUBLIC },
        },
      });
    }).toThrowError(/Make sure the given private subnets for your load balancer./);

  }); //end test case

  test('Internet facing', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::LoadBalancer')).toEqual(['testportalALB7CB15A19']);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      IpAddressType: 'ipv4',
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('Log bucket', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::S3::Bucket'))
      .toEqual([
        'testportallogbucketA87968B8',
      ]);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      LoggingConfiguration: {
        LogFilePrefix: 'bucket-access-logs',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('SecurityGroup', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::EC2::SecurityGroup'))
      .toEqual([
        'testsg872EB48A',
        'testportalfrontendfunctionsgC8D5E34D',
        'testportalportalsg53A8AF19',
      ]);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
      SecurityGroupEgress: [
        {
          CidrIp: '255.255.255.255/32',
          FromPort: 252,
          IpProtocol: 'icmp',
          ToPort: 86,
        },
      ],
    });
  });

  test('ALB access log', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'access_logs.s3.enabled',
          Value: 'true',
        },
        {
          Key: 'access_logs.s3.bucket',
          Value: {
            Ref: Match.anyValue(),
          },
        },
        {
          Key: 'access_logs.s3.prefix',
          Value: 'console-alb-access-logs/alb-log',
        },
      ]),
    });
  });

  test('ALB listener', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      DefaultActions: [
        {
          FixedResponseConfig: {
            MessageBody: 'Cannot route your request; no matching project found.',
            StatusCode: '404',
          },
          Type: 'fixed-response',
        },
      ],
      Protocol: 'HTTP',
      Certificates: Match.absent(),
      Port: 80,
    });
  });

  test('ALB targetGroup', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::TargetGroup'))
      .toEqual([
        'testportalALBListenercontrolplanetargetsGroupD1FDA581',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 60,
      Targets: [
        {
          Id: {
            'Fn::GetAtt': [
              Match.anyValue(),
              'Arn',
            ],
          },
        },
      ],
      TargetType: 'lambda',
    });
  });

  test('ALB listenerRule', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::ListenerRule'))
      .toEqual([
        'testportalALBListenercontrolplanetargetsRule15A7225D',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: [
        {
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: [
              '/*',
            ],
          },
        },
        {
          Field: 'http-request-method',
          HttpRequestMethodConfig: {
            Values: [
              'POST',
              'GET',
            ],
          },
        },
      ],
      Priority: 50,
    });
  });

  test('ALB Lambda function is created with expected properties', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::Lambda::Function'))
      .toEqual([
        'testportalportalfn1F095E03',
      ]);
    template.hasResourceProperties('AWS::Lambda::Function', {
      PackageType: 'Image',
      VpcConfig: Match.objectLike({
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      }),
      Timeout: 10,
      Architectures: [
        'arm64',
      ],
    });
    template.hasResource('AWS::Lambda::Function', { // create dependencies on execution role with sufficient policy to create ENI
      DependsOn: [
        'testportalportalfnroleDefaultPolicy69F46B1D',
        'testportalportalfnrole5B2099BA',
      ],
    });

  });

  test('IAM policies are created for Lambda functions', () => {
    const testElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const template = Template.fromStack(testElements.stack);

    expect(findResourcesName(template, 'AWS::IAM::Policy'))
      .toEqual([
        'testportalportalfnroleDefaultPolicy69F46B1D',
      ]);
    // create eni for running inside vpc
    template.hasResourceProperties('AWS::IAM::Policy', Match.objectLike({
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
              'ec2:AssignPrivateIpAddresses',
              'ec2:UnassignPrivateIpAddresses',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testportalportalfnroleDefaultPolicy69F46B1D',
      Roles: [
        {
          Ref: 'testportalportalfnrole5B2099BA',
        },
      ],
    }),
    );
  });

  test('ALB custom domain', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
    });

    let errorMsg = '';
    try {
      Template.fromStack(testStack);
    } catch (error) {
      errorMsg = (error as Error).message;
    }

    expect(errorMsg).toContain(Constant.ERROR_CUSTOM_DOMAIN_REQUIRE_HTTPS);
  });

  test('Certificate - no certificate', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      hasCert: false,
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::CertificateManager::Certificate'))
      .toEqual([
        'testportalCertificateA9F68FC7',
      ]);
    expect(findResourcesName(template, 'AWS::Route53::RecordSet'))
      .toEqual([
        'testportalaliasRecordF838F55A',
      ]);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
    });

  });

  test('Certificate', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      hasCert: true,
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::CertificateManager::Certificate'))
      .toEqual([
        'Certificate4E7ABB08',
      ]);
    expect(findResourcesName(template, 'AWS::Route53::RecordSet'))
      .toEqual([
        'testportalaliasRecordF838F55A',
      ]);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
    });

  });

  test('HTTPS protocol', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
      hasCert: true,
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
        'testportalALBHttpListener721DD53E',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      DefaultActions: [
        {
          FixedResponseConfig: {
            MessageBody: 'Cannot route your request; no matching project found.',
            StatusCode: '404',
          },
          Type: 'fixed-response',
        },
      ],
      Protocol: 'HTTPS',
      SslPolicy: 'ELBSecurityPolicy-TLS-1-2-Ext-2018-06',
      Certificates: [
        {
          CertificateArn: {
            Ref: Match.anyValue(),
          },
        },
      ],
    });
  }); //end test case

  test('HTTP redirect', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
      hasCert: true,
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
        'testportalALBHttpListener721DD53E',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      DefaultActions: [
        {
          RedirectConfig: {
            Port: '443',
            Protocol: 'HTTPS',
            StatusCode: 'HTTP_302',
          },
          Type: 'redirect',
        },
      ],
      Port: 80,
      Protocol: 'HTTP',
    });
  }); //end test case

  test('security inbound rule for http redirect', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
      hasCert: true,
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
    });
  }); //end test case

  test('Custom https port', () => {
    const testStack = TestEnv.newAlbStackWithPortalPropsAndCustomDomain(cdkOut, {
      hasCert: true,
      port: 9443,
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTPS,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);
    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
        'testportalALBHttpListener721DD53E',
      ]);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 9443,
      Protocol: 'HTTPS',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      DefaultActions: [
        {
          RedirectConfig: {
            Port: '9443',
            Protocol: 'HTTPS',
            StatusCode: 'HTTP_302',
          },
          Type: 'redirect',
        },
      ],
      Port: 80,
      Protocol: 'HTTP',
    });

  }); //end test case

  test('http - custom port', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      port: 8888,
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
      ]);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTP',
      Port: 8888,
    });

  }); //end test case

  test('security group for internal ALB', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: false,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::Listener'))
      .toEqual([
        'testportalALBListener1405B7D9',
      ]);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupEgress: [
        {
          CidrIp: '255.255.255.255/32',
          FromPort: 252,
          IpProtocol: 'icmp',
          ToPort: 86,
        },
      ],
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 80,
      ToPort: 80,
    });

  }); //end test case


  test('source security group for internal ALB', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: false,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);
    expect(findResourcesName(template, 'AWS::EC2::SecurityGroup'))
      .toEqual([
        'testsg872EB48A',
        'testportalfrontendfunctionsgC8D5E34D',
        'testportalportalsg53A8AF19',
        'testportalportalsourcesg8A7E3728',
      ]);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('portal_source_sg'),
    });

  }); //end test case

  test('DUAL Load balancer', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        ipAddressType: IpAddressType.DUAL_STACK,
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
        {
          CidrIpv6: '::/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      IpAddressType: 'dualstack',
      Subnets: ['subnet-11111111111111111', 'subnet-22222222222222222'],
      Scheme: 'internet-facing',
    });

  }); //end test case

  test('More application load balancer options', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        ipAddressType: IpAddressType.DUAL_STACK,
        http2Enabled: false,
        idleTimeout: Duration.seconds(600),
        healthCheckInterval: Duration.seconds(1200),
        logProps: {
          enableAccessLog: true,
        },
      },
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      IpAddressType: 'dualstack',
      Subnets: ['subnet-11111111111111111', 'subnet-22222222222222222'],
      Scheme: 'internet-facing',
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'routing.http2.enabled',
          Value: 'false',
        },
        {
          Key: 'idle_timeout.timeout_seconds',
          Value: '600',
        },
      ]),
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 1200,
      TargetType: 'lambda',
    });

  }); //end test case


  test('External log bucket for alb access log', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
      externalBucket: true,
    });

    const template = Template.fromStack(testStack);
    expect(findResourcesName(template, 'AWS::S3::Bucket'))
      .toEqual([
        'SolutionBucketDataBucket3F8C8D7C',
      ]);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'access_logs.s3.enabled',
          Value: 'true',
        },
        {
          Key: 'access_logs.s3.bucket',
          Value: {
            Ref: Match.anyValue(),
          },
        },
        {
          Key: 'access_logs.s3.prefix',
          Value: 'console-alb-access-logs/alb-log',
        },
      ]),
    });

  }); //end test case

  test('External log bucket for alb access log with custom prefix', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: true,
        },
      },
      externalBucket: true,
      prefix: 'test-prefix/',
    });

    const template = Template.fromStack(testStack);
    expect(findResourcesName(template, 'AWS::S3::Bucket'))
      .toEqual([
        'SolutionBucketDataBucket3F8C8D7C',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'access_logs.s3.prefix',
          Value: 'test-prefix/alb-log',
        },
      ]),
    });

  }); //end test case

  test('Disable alb access log', () => {
    const testStack = TestEnv.newAlbStackWithPortalProps(cdkOut, {
      applicationLoadBalancerProps: {
        internetFacing: true,
        protocol: ApplicationProtocol.HTTP,
        logProps: {
          enableAccessLog: false,
        },
      },
    });

    const template = Template.fromStack(testStack);

    template.resourceCountIs('AWS::S3::Bucket', 0);
    const albs = findResources(template, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
    let found = false;
    for (const alb of albs) {
      for (const attrObj of alb.Properties.LoadBalancerAttributes) {
        if (attrObj.Key === 'access_logs.s3.enabled') {
          found = true;
          break;
        }
      }
      if (found) {
        break;
      }
    }
    expect(!found);

  }); //end test case


  test('Public method addRoute', () => {
    const stackElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);
    const testFn = new Function(stackElements.stack, 'testFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: new InlineCode('test'),
    });

    const targets = [new LambdaTarget(testFn)];
    const healthCheck = {
      enabled: true,
      interval: Duration.seconds(800),
    };

    stackElements.portal.addRoute('testRoute', {
      routePath: '/api/test',
      priority: 20,
      target: targets,
      healthCheck: healthCheck,
    });

    const template = Template.fromStack(stackElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::ListenerRule'))
      .toEqual([
        'testportalALBListenercontrolplanetargetsRule15A7225D',
        'testportalALBListenertestRouteRuleFB76470F',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Actions: [
        {
          Type: 'forward',
        },
      ],
      Conditions: [
        {
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: [
              '/api/test',
            ],
          },
        },
      ],
      Priority: 20,
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 800,
    });

  }); //end test case

  test('Public method addFixedResponse', () => {
    const stackElements = TestEnv.newAlbStackWithDefaultPortal(cdkOut);

    stackElements.portal.addFixedResponse('testFixResponse', {
      routePath: '/config',
      priority: 10,
      contentType: 'application/json',
      content: '{status: 200}',
    });

    const template = Template.fromStack(stackElements.stack);

    expect(findResourcesName(template, 'AWS::ElasticLoadBalancingV2::ListenerRule'))
      .toEqual([
        'testportalALBListenercontrolplanetargetsRule15A7225D',
        'testportalALBListenertestFixResponseRule3068CA4A',
      ]);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Actions: [
        {
          FixedResponseConfig: {
            ContentType: 'application/json',
            MessageBody: '{status: 200}',
            StatusCode: '200',
          },
          Type: 'fixed-response',
        },
      ],
      Conditions: [
        {
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: [
              '/config',
            ],
          },
        },
      ],
      Priority: 10,
    });
  }); //end test case

}); //end test suite