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

import { Match } from 'aws-cdk-lib/assertions';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { findResourcesName, TestEnv } from './test-utils';
import { removeFolder } from '../common/jest';

if (process.env.CI !== 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => require('../cdk-lambda-nodejs-mock'));
}

describe('Click Stream Api ALB deploy Construct Test', () => {
  afterAll(() => {
    removeFolder(cdkOut);
  });

  const cdkOut = '/tmp/alb-portal-clickstream-api-test';

  const newALBApiStackTemplate = TestEnv.newALBApiStack(cdkOut).template;
  const newALBApiStackCNTemplate = TestEnv.newALBApiStack(cdkOut, true).template;

  test('DynamoDB table', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::DynamoDB::Table'))
      .toEqual([
        'testClickStreamALBApiClickstreamDictionary0A1156B6',
        'testClickStreamALBApiClickstreamMetadataA721B303',
        'testClickStreamALBApiAnalyticsMetadata4BCF420E',
      ]);

    newALBApiStackTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'name',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'name',
          AttributeType: 'S',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'type',
          KeyType: 'RANGE',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'type',
          AttributeType: 'S',
        },
        {
          AttributeName: 'prefix',
          AttributeType: 'S',
        },
        {
          AttributeName: 'createAt',
          AttributeType: 'N',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'prefix-time-index',
          KeySchema: [
            {
              AttributeName: 'prefix',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'createAt',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true,
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'month',
          AttributeType: 'S',
        },
        {
          AttributeName: 'prefix',
          AttributeType: 'S',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'prefix-month-index',
          KeySchema: [
            {
              AttributeName: 'prefix',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'month',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'month',
          KeyType: 'RANGE',
        },
      ],
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
    });
  });

  test('Api lambda Function', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::Lambda::Function'))
      .toEqual([
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceFunction504311BF',
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceProviderframeworkonEventFB731F8E',
        'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
        'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionE7DBCFDE',
        'testClickStreamALBApiBackendEventBusListenStateFunction8870ECA1',
        'testClickStreamALBApiBackendEventBusListenStackFunction5D951AF9',
        'testClickStreamALBApiApiFunction9890103B',
        'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A',
        'AWS679f53fac002430cb0da5b7982bd22872D164C4C',
      ]);

    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
      Environment: {
        Variables: {
          CLICK_STREAM_TABLE_NAME: {
            Ref: 'testClickStreamALBApiClickstreamMetadataA721B303',
          },
          DICTIONARY_TABLE_NAME: {
            Ref: 'testClickStreamALBApiClickstreamDictionary0A1156B6',
          },
          AWS_ACCOUNT_ID: {
            Ref: 'AWS::AccountId',
          },
          LOG_LEVEL: 'WARN',
          WITH_VALIDATE_ROLE: 'true',
          TEMPLATE_FILE: Match.not(Match.absent()),
          STACK_ID: Match.not(Match.absent()),
        },
      },
      MemorySize: 512,
      Timeout: 30,
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              'testClickStreamALBApiClickStreamApiFunctionSGC830FA60',
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          'subnet-33333333333333333',
          'subnet-44444444444444444',
        ],
      },
    });
    newALBApiStackTemplate.hasResource('AWS::Lambda::Function', {
      DependsOn: [
        'testClickStreamALBApiApiFunctionRoleDefaultPolicyC2CB9B91',
        'testClickStreamALBApiApiFunctionRole3C2198E5',
      ],
    });

    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          LOG_LEVEL: 'WARN',
          POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
        },
      },
    });

    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for dictionary init of solution Click Stream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for state machine action of solution Clickstream Analytics on AWS',
      Environment: {
        Variables: {
          POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
          POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
          LOG_LEVEL: 'WARN',
        },
      },
      Handler: 'index.handler',
      Runtime: 'nodejs20.x',
      Timeout: 15,
      TracingConfig: {
        Mode: 'Active',
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for state machine workflow of solution Clickstream Analytics on AWS',
      Environment: {
        Variables: {
          POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
          POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
          LOG_LEVEL: 'WARN',
        },
      },
      Handler: 'index.handler',
      Runtime: 'nodejs20.x',
      Timeout: 15,
      TracingConfig: {
        Mode: 'Active',
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
    });

  });

  test('Api lambda Function in GCR', () => {
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for dictionary init of solution Click Stream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for state machine action of solution Clickstream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
    });
  });

  test('QuickSight Embedding role', () => {
    const roleNames = [
      'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceRoleD2CDF2CF',
      'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceProviderframeworkonEventServiceRole256DF90A',
      'testClickStreamALBApiStackActionStateMachineActionFunctionRoleB3901335',
      'testClickStreamALBApiStackActionStateMachineRoleE114EFCD',
      'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionRole15F382D1',
      'testClickStreamALBApiStackWorkflowStateMachineRole7E1D20E5',
      'testClickStreamALBApiUploadRoleD732B7C0',
      'testClickStreamALBApiBackendEventBusListenStackFuncRole122CABAC',
      'testClickStreamALBApiBackendEventBusListenStateFuncRole498CB106',
      'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRole9741ECFB',
      'AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2',
      'testClickStreamALBApiApiFunctionRole3C2198E5',
    ];
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::IAM::Role').sort())
      .toEqual([
        ...roleNames,
        'testClickStreamALBApiQuickSightEmbedRole6CE59BC9',
      ].sort());
    expect(findResourcesName(newALBApiStackCNTemplate, 'AWS::IAM::Role').sort())
      .toEqual(roleNames.sort());
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
      Policies: [
        {
          PolicyDocument: {
            Statement: [
              {
                Action: 'quicksight:GenerateEmbedUrlForRegisteredUser',
                Effect: 'Allow',
                Resource: [
                  {
                    'Fn::Join': [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:*:',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':dashboard/clickstream*',
                      ],
                    ],
                  },
                  {
                    'Fn::Join': [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:*:',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':user/*',
                      ],
                    ],
                  },
                ],
              },
            ],
            Version: '2012-10-17',
          },
          PolicyName: 'quickSightEmbedPolicy',
        },
      ],
    });
  });

  test('IAM Resource for Api Lambda', () => {
    // Creates the function's execution role...
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('Check SecurityGroup', () => {
    newALBApiStackTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'apiTestStack/testClickStreamALBApi/ClickStreamApiFunctionSG',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1',
        },
      ],
      VpcId: 'vpc-11111111111111111',
    });

    newALBApiStackTemplate.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      Description: 'allow all traffic from application load balancer',
      GroupId: {
        'Fn::GetAtt': [
          'testClickStreamALBApiClickStreamApiFunctionSGC830FA60',
          'GroupId',
        ],
      },
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          'testsg872EB48A',
          'GroupId',
        ],
      },
    });
  });

  test('Policy', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::IAM::Policy'))
      .toEqual([
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceRoleDefaultPolicy2DB98D9D',
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceProviderframeworkonEventServiceRoleDefaultPolicy7EB8455A',
        'testClickStreamALBApiAddAdminUserCustomResourceAddAdminUserAwsCustomResourceCustomResourcePolicy58851F61',
        'testClickStreamALBApiStackActionStateMachineActionFunctionRoleDefaultPolicy22F19739',
        'testClickStreamALBApiStackActionStateMachineRoleDefaultPolicy2F163742',
        'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionRoleDefaultPolicy8BFD716F',
        'testClickStreamALBApiStackWorkflowStateMachineRoleDefaultPolicyDFDB6DE4',
        'testClickStreamALBApiBackendEventBusListenStateFuncRoleDefaultPolicy4F429680',
        'testClickStreamALBApiBackendEventBusListenStackFuncRoleDefaultPolicy2D9358B1',
        'testClickStreamALBApiApiFunctionRoleDefaultPolicyC2CB9B91',
        'testClickStreamALBApiUploadRoleDefaultPolicyEBF1E156',
        'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB',
      ]);
    // StateMachineActionFunctionRoleDefaultPolicy
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Policy', {
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
          {
            Action: [
              'cloudformation:CreateStack',
              'cloudformation:UpdateStack',
              'cloudformation:DeleteStack',
              'cloudformation:DescribeStacks',
              'cloudformation:UpdateTerminationProtection',
              'cloudformation:ContinueUpdateRollback',
              'cloudformation:RollbackStack',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':cloudformation:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':stack/Clickstream*',
                ],
              ],
            },
          },
          {
            Action: [
              'iam:GetRole',
              'iam:PassRole',
              'iam:DetachRolePolicy',
              'iam:GetPolicy',
              'iam:DeleteRolePolicy',
              'iam:CreateRole',
              'iam:DeleteRole',
              'iam:AttachRolePolicy',
              'iam:PutRolePolicy',
              'iam:ListRolePolicies',
              'iam:GetRolePolicy',
              'iam:CreateInstanceProfile',
              'iam:DeleteInstanceProfile',
              'iam:RemoveRoleFromInstanceProfile',
              'iam:AddRoleToInstanceProfile',
              'iam:ListPolicies',
              'iam:ListRoles',
              'iam:UpdateRoleDescription',
              'iam:TagRole',
              'iam:UntagRole',
              'iam:ListRoleTags',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/Clickstream*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':policy/Clickstream*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':instance-profile/Clickstream*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'iam:PassRole',
              'iam:CreateServiceLinkedRole',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/elasticloadbalancing.amazonaws.com/AWSServiceRoleForElasticLoadBalancing',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/globalaccelerator.amazonaws.com/AWSServiceRoleForGlobalAccelerator',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/servicecatalog-appregistry.amazonaws.com/AWSServiceRoleForAWSServiceCatalogAppRegistry',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'resource-groups:GetGroup',
              'resource-groups:DisassociateResource',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':resource-groups:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':group/AWS_AppRegistry_Application-clickstream-analytics-*',
                ],
              ],
            },
          },
          {
            Action: [
              'sns:*',
              'sqs:*',
              'redshift-serverless:*',
              's3:*',
              'apigateway:*',
              'logs:*',
              'redshift:*',
              'dynamodb:*',
              'autoscaling:*',
              'application-autoscaling:*',
              'glue:*',
              'cloudwatch:*',
              'emr-serverless:*',
              'ssm:*',
              'ecs:*',
              'lambda:*',
              'quicksight:*',
              'ec2:*',
              'events:*',
              'elasticloadbalancing:*',
              'kinesis:*',
              'kafka:*',
              'states:*',
              'secretsmanager:*',
              'globalaccelerator:*',
              'kms:*',
              'athena:*',
              'servicecatalog:CreateApplication',
              'servicecatalog:UpdateApplication',
              'servicecatalog:DeleteApplication',
              'servicecatalog:GetApplication',
              'servicecatalog:GetAssociatedResource',
              'servicecatalog:AssociateResource',
              'servicecatalog:DisassociateResource',
              'servicecatalog:TagResource',
              'servicecatalog:UntagResource',
              'tag:GetResources',
              'tag:UntagResources',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testClickStreamALBApiStackActionStateMachineActionFunctionRoleDefaultPolicy22F19739',
      Roles: [
        {
          Ref: 'testClickStreamALBApiStackActionStateMachineActionFunctionRoleB3901335',
        },
      ],
    });

    // StateMachineRoleDefaultPolicy
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'lambda:InvokeFunction',
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                        'Arn',
                      ],
                    },
                    ':*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'logs:CreateLogDelivery',
              'logs:GetLogDelivery',
              'logs:UpdateLogDelivery',
              'logs:DeleteLogDelivery',
              'logs:ListLogDeliveries',
              'logs:PutResourcePolicy',
              'logs:DescribeResourcePolicies',
              'logs:DescribeLogGroups',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testClickStreamALBApiStackActionStateMachineRoleDefaultPolicy2F163742',
      Roles: [
        {
          Ref: 'testClickStreamALBApiStackActionStateMachineRoleE114EFCD',
        },
      ],
    });

    // ApiFunctionRoleDefaultPolicy
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Policy', {
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
          {
            Action: 'states:StartExecution',
            Effect: 'Allow',
            Resource: [
              {
                Ref: 'testClickStreamALBApiStackActionStateMachineD1557E17',
              },
              {
                Ref: 'testClickStreamALBApiStackWorkflowStateMachineAE34E0DF',
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:ScanMetadataWorkflow*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:ClickstreamUserSegmentsWorkflowStateMachine*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'ec2:DescribeRegions',
              'ec2:DescribeVpcs',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeSubnets',
              'ec2:DescribeRouteTables',
              'ec2:DescribeVpcEndpoints',
              'ec2:DescribeSecurityGroupRules',
              'ec2:DescribeAvailabilityZones',
              'ec2:DescribeNatGateways',
              'kafka:ListClustersV2',
              'kafka:ListClusters',
              'kafka:ListNodes',
              's3:ListAllMyBuckets',
              'redshift:DescribeClusters',
              'redshift:DescribeClusterSubnetGroups',
              'redshift-serverless:ListWorkgroups',
              'redshift-serverless:GetWorkgroup',
              'redshift-serverless:GetNamespace',
              'redshift-data:BatchExecuteStatement',
              's3:ListBucket',
              's3:GetObject',
              's3:PutObject',
              'ds:AuthorizeApplication',
              'ds:UnauthorizeApplication',
              'ds:CheckAlias',
              'ds:CreateAlias',
              'ds:DescribeDirectories',
              'ds:DescribeTrusts',
              'ds:DeleteDirectory',
              'ds:CreateIdentityPoolDirectory',
              's3:GetBucketLocation',
              's3:GetBucketPolicy',
              'route53:ListHostedZones',
              'iam:ListRoles',
              'iam:ListServerCertificates',
              'iam:GetContextKeysForCustomPolicy',
              'iam:SimulateCustomPolicy',
              'states:DescribeExecution',
              'states:ListExecutions',
              'acm:ListCertificates',
              'cloudformation:DescribeStacks',
              'cloudformation:DescribeType',
              'secretsmanager:ListSecrets',
              'secretsmanager:GetSecretValue',
              'cloudwatch:DescribeAlarms',
              'cloudwatch:EnableAlarmActions',
              'cloudwatch:DisableAlarmActions',
              'events:PutRule',
              'events:ListTargetsByRule',
              'events:PutTargets',
              'events:TagResource',
              'events:UntagResource',
              'sns:CreateTopic',
              'sns:Subscribe',
              'sns:SetTopicAttributes',
              'sns:TagResource',
              'sns:UntagResource',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'quicksight:UpdateDashboardPermissions',
              'quicksight:CreateDataSet',
              'quicksight:DeleteDataSet',
              'quicksight:PassDataSet',
              'quicksight:PassDataSource',
              'quicksight:CreateDashboard',
              'quicksight:DeleteDashboard',
              'quicksight:UpdateDashboard',
              'quicksight:DescribeDashboard',
              'quicksight:UpdateDashboardPublishedVersion',
              'quicksight:CreateAnalysis',
              'quicksight:UpdateAnalysis',
              'quicksight:DeleteAnalysis',
              'quicksight:CreateFolderMembership',
              'quicksight:ListFolderMembers',
              'quicksight:DescribeFolder',
              'quicksight:CreateFolder',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':analysis/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dashboard/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dataset/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':datasource/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':folder/clickstream*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'quicksight:GenerateEmbedUrlForRegisteredUser',
              'quicksight:RegisterUser',
              'quicksight:DeleteUser',
              'quicksight:ListUsers',
              'quicksight:ListDataSets',
              'quicksight:ListDashboards',
              'quicksight:ListAnalyses',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':analysis/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dashboard/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dataset/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':user/*',
                  ],
                ],
              },
            ],
          },
          {
            Action: 'quicksight:DescribeAccountSubscription',
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':quicksight:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':*',
                ],
              ],
            },
          },
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':iam::',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':role/Clickstream*',
                ],
              ],
            },
          },
          {
            Action: [
              'events:RemoveTargets',
              'events:DeleteRule',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':events:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':rule/Clickstream-SegmentJobRule-*',
                ],
              ],
            },
          },
          {
            Action: 'iam:PassRole',
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'testClickStreamALBApiApiFunctionRole3C2198E5',
                'Arn',
              ],
            },
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiClickstreamDictionary0A1156B6',
                  'Arn',
                ],
              },
              {
                Ref: 'AWS::NoValue',
              },
            ],
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiClickstreamMetadataA721B303',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'testClickStreamALBApiClickstreamMetadataA721B303',
                        'Arn',
                      ],
                    },
                    '/index/*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiAnalyticsMetadata4BCF420E',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'testClickStreamALBApiAnalyticsMetadata4BCF420E',
                        'Arn',
                      ],
                    },
                    '/index/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testClickStreamALBApiApiFunctionRoleDefaultPolicyC2CB9B91',
      Roles: [
        {
          Ref: 'testClickStreamALBApiApiFunctionRole3C2198E5',
        },
      ],
    });
  });

  test('LogGroup', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::Logs::LogGroup'))
      .toEqual([
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceFunctionlog17E9C861',
        'testClickStreamALBApiStackActionStateMachineActionFunctionlog17DC1D55',
        'testClickStreamALBApiStackActionStateMachineLogGroupDE72356F',
        'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionlog8C09C32C',
        'testClickStreamALBApiStackWorkflowStateMachineLogGroupD7FD1922',
        'testClickStreamALBApiBackendEventBusListenStateFunctionlog97BF5A13',
        'testClickStreamALBApiBackendEventBusListenStackFunctionlog7B8AAC43',
      ]);

    newALBApiStackTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/vendedlogs/states/Clickstream/StackActionLogGroup-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      RetentionInDays: 180,
    });
  });

  test('Custom Resource', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::CloudFormation::CustomResource'))
      .toEqual([
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResource5AE5EDD9',
      ]);

    newALBApiStackTemplate.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      ServiceToken: {
        'Fn::GetAtt': [
          'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceProviderframeworkonEventFB731F8E',
          'Arn',
        ],
      },
      tableName: {
        Ref: 'testClickStreamALBApiClickstreamDictionary0A1156B6',
      },
    });

    newALBApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for dictionary init of solution Click Stream Analytics on AWS',
      Environment: {
        Variables: {
          POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
          LOG_LEVEL: 'WARN',
        },
      },
      Handler: 'index.handler',
      MemorySize: 256,
      Runtime: 'nodejs20.x',
      Timeout: 30,
    });
    expect(findResourcesName(newALBApiStackTemplate, 'Custom::AWS'))
      .toEqual([
        'testClickStreamALBApiAddAdminUserCustomResourceAddAdminUserAwsCustomResourceD9F42A0D',
      ]);
  });

  test('State Machine', () => {
    newALBApiStackTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"Execute Task","States":{"Execute Task":{"Next":"End?","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"End?":{"Type":"Choice","Choices":[{"Variable":"$.Action","StringEquals":"End","Next":"EndState"}],"Default":"Wait 30 Seconds"},"Wait 30 Seconds":{"Type":"Wait","Seconds":30,"Next":"Describe Stack"},"Stack in progress?":{"Type":"Choice","Choices":[{"Variable":"$.Result.StackStatus","StringMatches":"*_IN_PROGRESS","Next":"Wait 30 Seconds"}],"Default":"Callback Task"},"Describe Stack":{"Next":"Stack in progress?","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"Callback Task":{"Next":"EndState","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"EndState":{"Type":"Pass","End":true}},"TimeoutSeconds":7200}',
          ],
        ],
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"InputTask","States":{"InputTask":{"Next":"TypeChoice","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionE7DBCFDE',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"TypeChoice":{"Type":"Choice","OutputPath":"$.Data","Choices":[{"Variable":"$.Type","StringEquals":"Stack","Next":"StackExecution"},{"Variable":"$.Type","StringEquals":"Serial","Next":"SerialMap"},{"Variable":"$.Type","StringEquals":"Parallel","Next":"ParallelMap"}],"Default":"Pass"},"Pass":{"Type":"Pass","End":true},"StackExecution":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Action.$":"$.Input.Action","Token.$":"$$.Task.Token","Input.$":"$.Input","Callback.$":"$.Callback"},"StateMachineArn":"',
            {
              Ref: 'testClickStreamALBApiStackActionStateMachineD1557E17',
            },
            '"}},"SerialMap":{"Type":"Map","End":true,"ItemsPath":"$","ItemProcessor":{"ProcessorConfig":{"Mode":"INLINE"},"StartAt":"SerialCallSelf","States":{"SerialCallSelf":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Token.$":"$$.Task.Token","MapRun":true,"Data.$":"$"},"StateMachineArn":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            {
              Ref: 'AWS::AccountId',
            },
            ':stateMachine:clickstream-stack-workflow-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            '"}}}},"MaxConcurrency":1},"ParallelMap":{"Type":"Map","End":true,"ItemsPath":"$","ItemProcessor":{"ProcessorConfig":{"Mode":"INLINE"},"StartAt":"ParallelCallSelf","States":{"ParallelCallSelf":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Token.$":"$$.Task.Token","MapRun":true,"Data.$":"$"},"StateMachineArn":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            {
              Ref: 'AWS::AccountId',
            },
            ':stateMachine:clickstream-stack-workflow-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            '"}}}},"MaxConcurrency":40}},"TimeoutSeconds":259200}',
          ],
        ],
      },
    });
  });

});

describe('Click Stream Api Cloudfront deploy Construct Test', () => {
  afterAll(() => {
    removeFolder(cdkOut);
  });

  const cdkOut = '/tmp/cloudfront-portal-clickstream-api-test';
  const newALBApiStackTemplate = TestEnv.newALBApiStack(cdkOut).template;
  const newALBApiStackCNTemplate = TestEnv.newALBApiStack(cdkOut, true).template;
  const newCloudfrontApiStackTemplate = TestEnv.newCloudfrontApiStack(cdkOut).template;

  test('DynamoDB table', () => {
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'name',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'name',
          AttributeType: 'S',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'type',
          KeyType: 'RANGE',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'type',
          AttributeType: 'S',
        },
        {
          AttributeName: 'prefix',
          AttributeType: 'S',
        },
        {
          AttributeName: 'createAt',
          AttributeType: 'N',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'prefix-time-index',
          KeySchema: [
            {
              AttributeName: 'prefix',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'createAt',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true,
      },
    });
  });

  test('Api lambda Function', () => {
    expect(findResourcesName(newCloudfrontApiStackTemplate, 'AWS::Lambda::LayerVersion'))
      .toEqual([
        'testClickStreamCloudfrontApiLambdaAdapterLayerF0F222D4',
      ]);
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: [
        Runtime.NODEJS_16_X.toString(),
        Runtime.NODEJS_18_X.toString(),
        Runtime.NODEJS_20_X.toString(),
        Runtime.NODEJS_LATEST.toString(),
      ],
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
      Environment: {
        Variables: {
          AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
          CLICK_STREAM_TABLE_NAME: {
            Ref: 'testClickStreamCloudfrontApiClickstreamMetadata11A455BB',
          },
          DICTIONARY_TABLE_NAME: {
            Ref: 'testClickStreamCloudfrontApiClickstreamDictionaryB094D60B',
          },
          STACK_ACTION_STATE_MACHINE: {
            Ref: 'testClickStreamCloudfrontApiStackActionStateMachineF9686748',
          },
          STACK_WORKFLOW_STATE_MACHINE: {
            Ref: 'testClickStreamCloudfrontApiStackWorkflowStateMachine74FBB0F0',
          },
          STACK_WORKFLOW_S3_BUCKET: {
            Ref: 'stackWorkflowS3BucketF67B9562',
          },
          PREFIX_TIME_GSI_NAME: 'prefix-time-index',
          PREFIX_MONTH_GSI_NAME: 'prefix-month-index',
          AWS_ACCOUNT_ID: {
            Ref: 'AWS::AccountId',
          },
          AWS_URL_SUFFIX: {
            Ref: 'AWS::URLSuffix',
          },
          WITH_AUTH_MIDDLEWARE: 'false',
          ISSUER: '',
          STS_UPLOAD_ROLE_ARN: {
            'Fn::GetAtt': [
              'testClickStreamCloudfrontApiUploadRole7D6ED157',
              'Arn',
            ],
          },
          HEALTH_CHECK_PATH: '/',
          POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
          POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
          LOG_LEVEL: 'WARN',
        },
      },
      Handler: 'run.sh',
      Layers: [
        {
          Ref: 'testClickStreamCloudfrontApiLambdaAdapterLayerF0F222D4',
        },
      ],
      MemorySize: 512,
      Runtime: 'nodejs20.x',
      Timeout: 30,
    });
    newCloudfrontApiStackTemplate.hasResource('AWS::Lambda::Function', {
      DependsOn: [
        'testClickStreamCloudfrontApiApiFunctionRoleDefaultPolicyE0B97DC3',
        'testClickStreamCloudfrontApiApiFunctionRole1C15F66B',
      ],
    });

    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for dictionary init of solution Click Stream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for state machine action of solution Clickstream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
    });

  });

  test('Api lambda Function in GCR', () => {
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for dictionary init of solution Click Stream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Description: 'Lambda function for state machine action of solution Clickstream Analytics on AWS',
      Runtime: 'nodejs20.x',
    });
    newALBApiStackCNTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [
        Architecture.ARM_64.toString(),
      ],
      Environment: {
        Variables: {
          QUICKSIGHT_EMBED_ROLE_ARN: '',
        },
      },
      Description: 'Lambda function for api of solution Clickstream Analytics on AWS',
    });

  });

  test('IAM Resource for Api Lambda', () => {
    // Creates the function's execution role...
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('ApiGateway', () => {
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'ANY',
      ResourceId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApiproxyF7B82220',
      },
      RestApiId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApi77242134',
      },
      AuthorizationType: 'CUSTOM',
      Integration: {
        IntegrationHttpMethod: 'POST',
        Type: 'AWS_PROXY',
        Uri: {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':apigateway:',
              {
                Ref: 'AWS::Region',
              },
              ':lambda:path/2015-03-31/functions/',
              {
                'Fn::GetAtt': [
                  'testClickStreamCloudfrontApiApiFunctionD30AC413',
                  'Arn',
                ],
              },
              '/invocations',
            ],
          ],
        },
      },
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'ANY',
      ResourceId: {
        'Fn::GetAtt': [
          'testClickStreamCloudfrontApiClickStreamApi77242134',
          'RootResourceId',
        ],
      },
      RestApiId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApi77242134',
      },
      AuthorizationType: 'CUSTOM',
      Integration: {
        IntegrationHttpMethod: 'POST',
        Type: 'AWS_PROXY',
        Uri: {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':apigateway:',
              {
                Ref: 'AWS::Region',
              },
              ':lambda:path/2015-03-31/functions/',
              {
                'Fn::GetAtt': [
                  'testClickStreamCloudfrontApiApiFunctionD30AC413',
                  'Arn',
                ],
              },
              '/invocations',
            ],
          ],
        },
      },
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: [
          'REGIONAL',
        ],
      },
      Name: 'ClickStreamApi',
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::Deployment', {
      RestApiId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApi77242134',
      },
      Description: 'Automatically created by the RestApi construct',
    });
    newCloudfrontApiStackTemplate.hasResource('AWS::ApiGateway::Deployment', {
      DependsOn: [
        'testClickStreamCloudfrontApiClickStreamApiproxyANY2AD1F4B4',
        'testClickStreamCloudfrontApiClickStreamApiproxyF7B82220',
        'testClickStreamCloudfrontApiClickStreamApiANY34E982F9',
      ],
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
      RestApiId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApi77242134',
      },
      AccessLogSetting: {
        DestinationArn: {
          'Fn::GetAtt': [
            'testClickStreamCloudfrontApiLogGroupA3049296',
            'Arn',
          ],
        },
        Format: '$context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] "$context.httpMethod $context.resourcePath $context.protocol" $context.status $context.responseLength $context.requestId',
      },
      DeploymentId: {
        Ref: 'testClickStreamCloudfrontApiClickStreamApiDeploymentD81E884A50b4b46e84c4d3354fa978ebcd6c1d08',
      },
      MethodSettings: [
        {
          DataTraceEnabled: false,
          HttpMethod: '*',
          LoggingLevel: 'ERROR',
          MetricsEnabled: true,
          ResourcePath: '/*',
        },
      ],
      StageName: 'api',
      TracingEnabled: true,
    });
    newCloudfrontApiStackTemplate.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
      ApiStages: [
        {
          ApiId: {
            Ref: 'testClickStreamCloudfrontApiClickStreamApi77242134',
          },
          Stage: {
            Ref: 'testClickStreamCloudfrontApiClickStreamApiDeploymentStageapiE3BAC942',
          },
          Throttle: {},
        },
      ],
      Throttle: {
        BurstLimit: 100,
        RateLimit: 50,
      },
    });
  });

  test('LogGroup', () => {
    newALBApiStackTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/vendedlogs/states/Clickstream/StackActionLogGroup-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      RetentionInDays: 180,
    });
  });

  test('State Machine', () => {
    newALBApiStackTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"Execute Task","States":{"Execute Task":{"Next":"End?","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"End?":{"Type":"Choice","Choices":[{"Variable":"$.Action","StringEquals":"End","Next":"EndState"}],"Default":"Wait 30 Seconds"},"Wait 30 Seconds":{"Type":"Wait","Seconds":30,"Next":"Describe Stack"},"Stack in progress?":{"Type":"Choice","Choices":[{"Variable":"$.Result.StackStatus","StringMatches":"*_IN_PROGRESS","Next":"Wait 30 Seconds"}],"Default":"Callback Task"},"Describe Stack":{"Next":"Stack in progress?","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"Callback Task":{"Next":"EndState","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackActionStateMachineActionFunction9CC75763',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"EndState":{"Type":"Pass","End":true}},"TimeoutSeconds":7200}',
          ],
        ],
      },
    });
    newALBApiStackTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"InputTask","States":{"InputTask":{"Next":"TypeChoice","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","OutputPath":"$.Payload","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::lambda:invoke","Parameters":{"FunctionName":"',
            {
              'Fn::GetAtt': [
                'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionE7DBCFDE',
                'Arn',
              ],
            },
            '","Payload.$":"$"}},"TypeChoice":{"Type":"Choice","OutputPath":"$.Data","Choices":[{"Variable":"$.Type","StringEquals":"Stack","Next":"StackExecution"},{"Variable":"$.Type","StringEquals":"Serial","Next":"SerialMap"},{"Variable":"$.Type","StringEquals":"Parallel","Next":"ParallelMap"}],"Default":"Pass"},"Pass":{"Type":"Pass","End":true},"StackExecution":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Action.$":"$.Input.Action","Token.$":"$$.Task.Token","Input.$":"$.Input","Callback.$":"$.Callback"},"StateMachineArn":"',
            {
              Ref: 'testClickStreamALBApiStackActionStateMachineD1557E17',
            },
            '"}},"SerialMap":{"Type":"Map","End":true,"ItemsPath":"$","ItemProcessor":{"ProcessorConfig":{"Mode":"INLINE"},"StartAt":"SerialCallSelf","States":{"SerialCallSelf":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Token.$":"$$.Task.Token","MapRun":true,"Data.$":"$"},"StateMachineArn":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            {
              Ref: 'AWS::AccountId',
            },
            ':stateMachine:clickstream-stack-workflow-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            '"}}}},"MaxConcurrency":1},"ParallelMap":{"Type":"Map","End":true,"ItemsPath":"$","ItemProcessor":{"ProcessorConfig":{"Mode":"INLINE"},"StartAt":"ParallelCallSelf","States":{"ParallelCallSelf":{"End":true,"Type":"Task","Resource":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::states:startExecution.sync:2","Parameters":{"Input":{"Token.$":"$$.Task.Token","MapRun":true,"Data.$":"$"},"StateMachineArn":"arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            {
              Ref: 'AWS::AccountId',
            },
            ':stateMachine:clickstream-stack-workflow-',
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      'Fn::Select': [
                        2,
                        {
                          'Fn::Split': [
                            '/',
                            {
                              Ref: 'AWS::StackId',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            '"}}}},"MaxConcurrency":40}},"TimeoutSeconds":259200}',
          ],
        ],
      },
    });
  });

});

describe('Click Stream Api ALB deploy Construct With IAM Role Prefix', () => {
  afterAll(() => {
    removeFolder(cdkOut);
  });

  const cdkOut = '/tmp/alb-portal-clickstream-api-with-prefix-test';

  const newALBApiStackTemplate = TestEnv.newALBWithRolePrefixApiStack(cdkOut).template;

  test('Policy', () => {
    expect(findResourcesName(newALBApiStackTemplate, 'AWS::IAM::Policy'))
      .toEqual([
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceRoleDefaultPolicy2DB98D9D',
        'testClickStreamALBApiBatchInsertDDBCustomResourceDicInitCustomResourceProviderframeworkonEventServiceRoleDefaultPolicy7EB8455A',
        'testClickStreamALBApiAddAdminUserCustomResourceAddAdminUserAwsCustomResourceCustomResourcePolicy58851F61',
        'testClickStreamALBApiStackActionStateMachineActionFunctionRoleDefaultPolicy22F19739',
        'testClickStreamALBApiStackActionStateMachineRoleDefaultPolicy2F163742',
        'testClickStreamALBApiStackWorkflowStateMachineWorkflowFunctionRoleDefaultPolicy8BFD716F',
        'testClickStreamALBApiStackWorkflowStateMachineRoleDefaultPolicyDFDB6DE4',
        'testClickStreamALBApiBackendEventBusListenStateFuncRoleDefaultPolicy4F429680',
        'testClickStreamALBApiBackendEventBusListenStackFuncRoleDefaultPolicy2D9358B1',
        'testClickStreamALBApiApiFunctionRoleDefaultPolicyC2CB9B91',
        'testClickStreamALBApiUploadRoleDefaultPolicyEBF1E156',
        'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB',
      ]);

    // ActionFunctionRoleDefaultPolicy
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Policy', {
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
          {
            Action: [
              'cloudformation:CreateStack',
              'cloudformation:UpdateStack',
              'cloudformation:DeleteStack',
              'cloudformation:DescribeStacks',
              'cloudformation:UpdateTerminationProtection',
              'cloudformation:ContinueUpdateRollback',
              'cloudformation:RollbackStack',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':cloudformation:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':stack/testRolePrefix-Clickstream*',
                ],
              ],
            },
          },
          {
            Action: [
              'iam:GetRole',
              'iam:PassRole',
              'iam:DetachRolePolicy',
              'iam:GetPolicy',
              'iam:DeleteRolePolicy',
              'iam:CreateRole',
              'iam:DeleteRole',
              'iam:AttachRolePolicy',
              'iam:PutRolePolicy',
              'iam:ListRolePolicies',
              'iam:GetRolePolicy',
              'iam:CreateInstanceProfile',
              'iam:DeleteInstanceProfile',
              'iam:RemoveRoleFromInstanceProfile',
              'iam:AddRoleToInstanceProfile',
              'iam:ListPolicies',
              'iam:ListRoles',
              'iam:UpdateRoleDescription',
              'iam:TagRole',
              'iam:UntagRole',
              'iam:ListRoleTags',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/testRolePrefix*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':policy/testRolePrefix*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':instance-profile/testRolePrefix*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'iam:PassRole',
              'iam:CreateServiceLinkedRole',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/elasticloadbalancing.amazonaws.com/AWSServiceRoleForElasticLoadBalancing',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/globalaccelerator.amazonaws.com/AWSServiceRoleForGlobalAccelerator',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/aws-service-role/servicecatalog-appregistry.amazonaws.com/AWSServiceRoleForAWSServiceCatalogAppRegistry',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'resource-groups:GetGroup',
              'resource-groups:DisassociateResource',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':resource-groups:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':group/AWS_AppRegistry_Application-clickstream-analytics-*',
                ],
              ],
            },
          },
          {
            Action: [
              'sns:*',
              'sqs:*',
              'redshift-serverless:*',
              's3:*',
              'apigateway:*',
              'logs:*',
              'redshift:*',
              'dynamodb:*',
              'autoscaling:*',
              'application-autoscaling:*',
              'glue:*',
              'cloudwatch:*',
              'emr-serverless:*',
              'ssm:*',
              'ecs:*',
              'lambda:*',
              'quicksight:*',
              'ec2:*',
              'events:*',
              'elasticloadbalancing:*',
              'kinesis:*',
              'kafka:*',
              'states:*',
              'secretsmanager:*',
              'globalaccelerator:*',
              'kms:*',
              'athena:*',
              'servicecatalog:CreateApplication',
              'servicecatalog:UpdateApplication',
              'servicecatalog:DeleteApplication',
              'servicecatalog:GetApplication',
              'servicecatalog:GetAssociatedResource',
              'servicecatalog:AssociateResource',
              'servicecatalog:DisassociateResource',
              'servicecatalog:TagResource',
              'servicecatalog:UntagResource',
              'tag:GetResources',
              'tag:UntagResources',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testClickStreamALBApiStackActionStateMachineActionFunctionRoleDefaultPolicy22F19739',
      Roles: [
        {
          Ref: 'testClickStreamALBApiStackActionStateMachineActionFunctionRoleB3901335',
        },
      ],
    });

    // ApiFunctionRoleDefaultPolicy
    newALBApiStackTemplate.hasResourceProperties('AWS::IAM::Policy', {
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
          {
            Action: 'states:StartExecution',
            Effect: 'Allow',
            Resource: [
              {
                Ref: 'testClickStreamALBApiStackActionStateMachineD1557E17',
              },
              {
                Ref: 'testClickStreamALBApiStackWorkflowStateMachineAE34E0DF',
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:ScanMetadataWorkflow*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:ClickstreamUserSegmentsWorkflowStateMachine*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'ec2:DescribeRegions',
              'ec2:DescribeVpcs',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeSubnets',
              'ec2:DescribeRouteTables',
              'ec2:DescribeVpcEndpoints',
              'ec2:DescribeSecurityGroupRules',
              'ec2:DescribeAvailabilityZones',
              'ec2:DescribeNatGateways',
              'kafka:ListClustersV2',
              'kafka:ListClusters',
              'kafka:ListNodes',
              's3:ListAllMyBuckets',
              'redshift:DescribeClusters',
              'redshift:DescribeClusterSubnetGroups',
              'redshift-serverless:ListWorkgroups',
              'redshift-serverless:GetWorkgroup',
              'redshift-serverless:GetNamespace',
              'redshift-data:BatchExecuteStatement',
              's3:ListBucket',
              's3:GetObject',
              's3:PutObject',
              'ds:AuthorizeApplication',
              'ds:UnauthorizeApplication',
              'ds:CheckAlias',
              'ds:CreateAlias',
              'ds:DescribeDirectories',
              'ds:DescribeTrusts',
              'ds:DeleteDirectory',
              'ds:CreateIdentityPoolDirectory',
              's3:GetBucketLocation',
              's3:GetBucketPolicy',
              'route53:ListHostedZones',
              'iam:ListRoles',
              'iam:ListServerCertificates',
              'iam:GetContextKeysForCustomPolicy',
              'iam:SimulateCustomPolicy',
              'states:DescribeExecution',
              'states:ListExecutions',
              'acm:ListCertificates',
              'cloudformation:DescribeStacks',
              'cloudformation:DescribeType',
              'secretsmanager:ListSecrets',
              'secretsmanager:GetSecretValue',
              'cloudwatch:DescribeAlarms',
              'cloudwatch:EnableAlarmActions',
              'cloudwatch:DisableAlarmActions',
              'events:PutRule',
              'events:ListTargetsByRule',
              'events:PutTargets',
              'events:TagResource',
              'events:UntagResource',
              'sns:CreateTopic',
              'sns:Subscribe',
              'sns:SetTopicAttributes',
              'sns:TagResource',
              'sns:UntagResource',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: [
              'quicksight:UpdateDashboardPermissions',
              'quicksight:CreateDataSet',
              'quicksight:DeleteDataSet',
              'quicksight:PassDataSet',
              'quicksight:PassDataSource',
              'quicksight:CreateDashboard',
              'quicksight:DeleteDashboard',
              'quicksight:UpdateDashboard',
              'quicksight:DescribeDashboard',
              'quicksight:UpdateDashboardPublishedVersion',
              'quicksight:CreateAnalysis',
              'quicksight:UpdateAnalysis',
              'quicksight:DeleteAnalysis',
              'quicksight:CreateFolderMembership',
              'quicksight:ListFolderMembers',
              'quicksight:DescribeFolder',
              'quicksight:CreateFolder',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':analysis/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dashboard/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dataset/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':datasource/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':folder/clickstream*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'quicksight:GenerateEmbedUrlForRegisteredUser',
              'quicksight:RegisterUser',
              'quicksight:DeleteUser',
              'quicksight:ListUsers',
              'quicksight:ListDataSets',
              'quicksight:ListDashboards',
              'quicksight:ListAnalyses',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':analysis/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dashboard/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':dataset/*',
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':quicksight:*:',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':user/*',
                  ],
                ],
              },
            ],
          },
          {
            Action: 'quicksight:DescribeAccountSubscription',
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':quicksight:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':*',
                ],
              ],
            },
          },
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':iam::',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':role/testRolePrefix*',
                ],
              ],
            },
          },
          {
            Action: [
              'events:RemoveTargets',
              'events:DeleteRule',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':events:*:',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':rule/Clickstream-SegmentJobRule-*',
                ],
              ],
            },
          },
          {
            Action: 'iam:PassRole',
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'testClickStreamALBApiApiFunctionRole3C2198E5',
                'Arn',
              ],
            },
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiClickstreamDictionary0A1156B6',
                  'Arn',
                ],
              },
              {
                Ref: 'AWS::NoValue',
              },
            ],
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiClickstreamMetadataA721B303',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'testClickStreamALBApiClickstreamMetadataA721B303',
                        'Arn',
                      ],
                    },
                    '/index/*',
                  ],
                ],
              },
            ],
          },
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'testClickStreamALBApiAnalyticsMetadata4BCF420E',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'testClickStreamALBApiAnalyticsMetadata4BCF420E',
                        'Arn',
                      ],
                    },
                    '/index/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'testClickStreamALBApiApiFunctionRoleDefaultPolicyC2CB9B91',
      Roles: [
        {
          Ref: 'testClickStreamALBApiApiFunctionRole3C2198E5',
        },
      ],
    });
  });
});
