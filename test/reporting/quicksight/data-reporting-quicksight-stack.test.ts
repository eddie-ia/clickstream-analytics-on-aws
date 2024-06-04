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

import { OUTPUT_REPORTING_QUICKSIGHT_DASHBOARDS, OUTPUT_REPORTING_QUICKSIGHT_DATA_SOURCE_ARN, OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_DATABASE_NAME, OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_DATA_API_ROLE_ARN, OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_ENDPOINT_ADDRESS } from '@aws/clickstream-base-lib';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataReportingQuickSightStack } from '../../../src/data-reporting-quicksight-stack';

if (process.env.CI !== 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => require('../../cdk-lambda-nodejs-mock'));
}

describe('DataReportingQuickSightStack parameter test', () => {
  const app = new App();
  const testId = 'test-1';
  const stack = new DataReportingQuickSightStack(app, testId+'-data-analytics-quicksight-stack', {});
  const template = Template.fromStack(stack);

  beforeEach(() => {
  });

  test('Has Dashboards output', () => {
    template.hasOutput(OUTPUT_REPORTING_QUICKSIGHT_DASHBOARDS, {});
  });

  test('Has Dashboards output', () => {
    template.hasOutput(OUTPUT_REPORTING_QUICKSIGHT_DATA_SOURCE_ARN, {});
  });

  test('Has Redshift serverless data api role output', () => {
    template.hasOutput(OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_DATA_API_ROLE_ARN, {});
  });

  test('Has Redshift database name output', () => {
    template.hasOutput(OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_DATABASE_NAME, {});
  });

  test('Has Redshift serverless workgroup name', () => {
    template.hasOutput(OUTPUT_REPORTING_QUICKSIGHT_REDSHIFT_ENDPOINT_ADDRESS, {});
  });

  test('Should has Parameter quickSightUserParam', () => {
    template.hasParameter('QuickSightUserParam', {
      Type: 'String',
    });
  });

  test('Should has Parameter quickSightNamespaceParam', () => {
    template.hasParameter('QuickSightNamespaceParam', {
      Type: 'String',
    });
  });

  test('Should has Parameter QuickSightVpcConnectionSGParam', () => {
    template.hasParameter('QuickSightVpcConnectionSGParam', {});
  });

  test('Should has Parameter QuickSightVpcConnectionSubnetParam', () => {
    template.hasParameter('QuickSightVpcConnectionSubnetParam', {});
  });

  test('Should has Parameter QuickSightOwnerPrincipalParam', () => {
    template.hasParameter('QuickSightOwnerPrincipalParam', {
      Type: 'String',
    });
  });

  test('Should has Parameter QuickSightTimezoneParam', () => {
    template.hasParameter('QuickSightTimezoneParam', {
      Type: 'String',
      Default: '[]',
    });
  });

  test('Should has Parameter QuickSightUseSpiceParam', () => {
    template.hasParameter('QuickSightUseSpiceParam', {
      Type: 'String',
      Default: 'no',
      AllowedValues: ['no', 'yes'],
    });
  });

  test('Should has Parameter redshiftEndpointParam', () => {
    template.hasParameter('RedshiftEndpointParam', {
      Type: 'String',
    });
  });

  test('Should has Parameter redshiftDBParam', () => {
    template.hasParameter('RedshiftDBParam', {
      Type: 'String',
    });
  });

  test('Should has Parameter redshiftDefaultDBParam', () => {
    template.hasParameter('RedshiftDefaultDBParam', {
      Type: 'String',
      Default: 'dev',
    });
  });

  test('Should has Parameter redShiftDBSchemaParam', () => {
    template.hasParameter('RedShiftDBSchemaParam', {
      Description: 'Comma delimited Redshift database schema name list',
      Type: 'String',
    });
  });

  test('Should has Parameter redshiftPortParam', () => {
    template.hasParameter('RedshiftPortParam', {
      Type: 'Number',
    });
  });

  test('Should has Parameter redshiftIAMRoleParam', () => {
    template.hasParameter('RedshiftIAMRoleParam', {
      Type: 'String',
    });
  });

  test('QuickSightUserParam pattern', () => {
    const param = template.toJSON().Parameters.QuickSightUserParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'abc-123',
      'abc_456',
      'Abc_456_def',
      '1abcd',
      '123345',
      'test@example.com',
      'Admin/test',
      'test-test',
      'test-ABC@example.com',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'test;123',
      'test#',
      'a',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('QuickSightPrincipalArnParam pattern', () => {
    const param = template.toJSON().Parameters.QuickSightOwnerPrincipalParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);

    const validValues = [
      'arn:aws:quicksight:us-east-1:111111111111:user/default/clickstream',
      'arn:aws:quicksight:us-east-1:111111111111:user/default/Admin/testuser',
      'arn:aws:quicksight:us-east-1:111111111111:user/default/Admin/testuser@example.com',
      'arn:aws-cn:quicksight:cn-north-1:111111111111:user/namespace1/testuser@example.com',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'testArn',
      'arn:aws:quicksight:us-east-1:2211:user/default/clickstream',
      'arn:aws:quicksight:us-east-1:111111111111:user/123/Admin/testuser',
      'arn:aws:quicksight:us-east-1:111111111111:user/default/test;123',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('QuickSightNamespaceParam pattern', () => {
    const param = template.toJSON().Parameters.QuickSightNamespaceParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'abcde',
      'ABC1234',
      'default',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      '_abcedf',
      '-jklsks',
      'abc$rt',
      '123',
      'abc',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('QuickSightVpcConnectionSubnetParam pattern', () => {
    const param = template.toJSON().Parameters.QuickSightVpcConnectionSubnetParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'subnet-06e3a4689f1025e5b,subnet-06e3a4689f1025eab',
      'subnet-aaaaaaaa,subnet-bbbbbbb,subnet-ccccccc,',

    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'Subnet-06e3a4689f1025e5b',
      'subnet-06e3a4689f1025e5b,  subnet-06e3a4689f102fff',
      'xxxxxx-06e3a4689f1025e5b,yyyyy-06e3a4689f1025e5b',
      'subnet-06E3a4689f1025e5b',
      'subnet-1231aacc',
      'subnet-cccc',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('QuickSightVpcConnectionSGParam pattern', () => {
    const param = template.toJSON().Parameters.QuickSightVpcConnectionSGParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'sg-0757849a2a9eebc4c,sg-11111aaaaaaaaa',
      'sg-0757849a2a9eebc4c,sg-11111aaaaaaaaa,sg-11111bbbbbbbb',
      'sg-0757849a2a9eebc4c',
      'sg-12345678',
    ];

    for (const v of validValues) {
      for ( const t of v.split(',')) {
        expect(t).toMatch(regex);
      }
    }

    const invalidValues = [
      'sg-0757849a2a9eebc4c,  sg-11111aaaaaaaaa',
      'xxxxxx-0757849a2a9eebc4c',
      'subnet-0757849a2a9Eebc4c',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('RedshiftDBParam pattern', () => {
    const param = template.toJSON().Parameters.RedshiftDBParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'abc',
      'aaa12',
      'abc_ef',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'ACde',
      'bCde',
      'abc-ef',
      'abc$rt',
      '123',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('RedShiftDBSchemaParam pattern', () => {
    const param = template.toJSON().Parameters.RedShiftDBSchemaParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      '',
      'abc',
      'abcd,efgh',
      'aaa12',
      'abc_ef',
      'ACde',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'abc-ef',
      'abc$rt',
      '123',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('RedshiftEndpointParam pattern', () => {
    const param = template.toJSON().Parameters.RedshiftEndpointParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'abc.com',
      'test.abc.com',
      '123.test.abc.com',
      '123.test-v1.abc.com',
      'test_v1.abc.com',
      'a123#~&%.test-2.a_bc.com',
      'a.b.c.d.e.f.com',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      '',
      'a',
      'abc.example_test',
      'abc.c',
      'abc^.com',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

  test('Should has Parameter AppRegistryApplicationArn', () => {
    template.hasParameter('AppRegistryApplicationArn', {
      Type: 'String',
    });
  });

  test('RedshiftIAMRole allowedPattern', () => {
    const param = template.toJSON().Parameters.RedshiftIAMRoleParam;
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'arn:aws:iam::000000000000:role/redshift-serverless-role',
      'arn:aws-cn:iam::000000000000:role/redshift-serverless-role',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'arn:aws:iam::xxxxxxxxxxxx:role/redshift-serverless-role',
      'arn:aws:iam::1234:role/redshift-serverless-role',
      'b1.test.com:abc',
      'b-1.test.com:9092,b-2.test.com:9092',
      'b1.test.com:9092',
      'b_1.test.com',
      '',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });

});

describe('DataReportingQuickSightStack resource test', () => {
  const app = new App();
  const testId = 'test-2';
  const stack = new DataReportingQuickSightStack(app, testId+'-data-analytics-quicksight-stack', {});
  const template = Template.fromStack(stack);

  template.resourcePropertiesCountIs('AWS::IAM::Policy',
    {
      PolicyDocument:
    {
      Statement:
        [
          {
            Action:
                [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:CreateLogGroup',
                ],
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action:
                [
                  'quicksight:DescribeDataSource',
                  'quicksight:PassDataSource',
                  'quicksight:DescribeDataSourcePermissions',
                  'quicksight:UpdateDataSourcePermissions',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':datasource/clickstream_datasource_*',
                      ],
                    ],
                },
          },
          {
            Action:
                [
                  'quicksight:DescribeTemplate',
                  'quicksight:ListTemplateVersions',
                ],
            Effect: 'Allow',
            Resource:
                [
                  {
                    'Fn::Join':
                        [
                          '',
                          [
                            'arn:',
                            {
                              Ref: 'AWS::Partition',
                            },
                            ':quicksight:',
                            {
                              Ref: 'AWS::Region',
                            },
                            ':',
                            {
                              Ref: 'AWS::AccountId',
                            },
                            ':template/clickstream_template_*',
                          ],
                        ],
                  },
                  {
                    'Fn::GetAtt':
                        [
                          'ClickstreamTemplateDef',
                          'Arn',
                        ],
                  },
                ],
          },
          {
            Action:
                [
                  'quicksight:DescribeDataSet',
                  'quicksight:DeleteDataSet',
                  'quicksight:CreateDataSet',
                  'quicksight:UpdateDataSet',
                  'quicksight:PassDataSet',
                  'quicksight:PassDataSource',
                  'quicksight:UpdateDataSetPermissions',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':dataset/clickstream_dataset_*',
                      ],
                    ],
                },
          },
          {
            Action:
                [
                  'quicksight:DescribeAnalysis',
                  'quicksight:DeleteAnalysis',
                  'quicksight:CreateAnalysis',
                  'quicksight:UpdateAnalysis',
                  'quicksight:UpdateAnalysisPermissions',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':analysis/clickstream_analysis_*',
                      ],
                    ],
                },
          },
          {
            Action:
                [
                  'quicksight:DescribeDashboard',
                  'quicksight:DeleteDashboard',
                  'quicksight:CreateDashboard',
                  'quicksight:UpdateDashboard',
                  'quicksight:UpdateDashboardPermissions',
                  'quicksight:UpdateDashboardPublishedVersion',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':dashboard/clickstream_dashboard_*',
                      ],
                    ],
                },
          },
          {
            Action:
                [
                  'quicksight:DescribeRefreshSchedule',
                  'quicksight:CreateRefreshSchedule',
                  'quicksight:UpdateRefreshSchedule',
                  'quicksight:DeleteRefreshSchedule',
                  'quicksight:PutDataSetRefreshProperties',
                  'quicksight:DescribeDataSetRefreshProperties',
                  'quicksight:DeleteDataSetRefreshProperties',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':dataset/clickstream_dataset_*',
                      ],
                    ],
                },
          },
          {
            Action:
                [
                  'quicksight:CreateFolderMembership',
                  'quicksight:DeleteFolderMembership',
                  'quicksight:DescribeFolder',
                  'quicksight:CreateFolder',
                  'quicksight:DeleteFolder',
                  'quicksight:UpdateFolder',
                  'quicksight:UpdateFolderPermissions',
                  'quicksight:ListFolderMembers',
                ],
            Effect: 'Allow',
            Resource:
                {
                  'Fn::Join':
                    [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':quicksight:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':folder/clickstream*',
                      ],
                    ],
                },
          },
        ],
      Version: '2012-10-17',
    },
      PolicyName: 'QuicksightCustomResourceLambdaRoleDefaultPolicyA0EB8B03',
      Roles:
    [
      {
        Ref: 'QuicksightCustomResourceLambdaRole58092032',
      },
    ],
    }, 1);

  template.resourcePropertiesCountIs('AWS::Lambda::Function', {
    Code: Match.anyValue(),
    Role: {
      'Fn::GetAtt': [
        Match.stringLikeRegexp('QuicksightCustomResourceLambdaRole[0-9]+'),
        'Arn',
      ],
    },
    Environment: {
      Variables: {
        POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
        POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        LOG_LEVEL: 'WARN',
      },
    },
    LoggingConfig: {
      LogFormat: 'JSON',
      ApplicationLogLevel: 'INFO',
      LogGroup: {
        Ref: 'QuicksightCustomResourceLambdalog376BFB51',
      },
    },
    Handler: 'index.handler',
    MemorySize: 256,
    Timeout: 900,
  }, 1);

  template.resourcePropertiesCountIs('AWS::QuickSight::VPCConnection', {
    AwsAccountId: {
      Ref: 'AWS::AccountId',
    },
    RoleArn: {
      'Fn::GetAtt': [
        'VPCConnectionCreateRoleC12A5544',
        'Arn',
      ],
    },
    SecurityGroupIds: {
      Ref: 'QuickSightVpcConnectionSGParam',
    },
    SubnetIds: {
      'Fn::Split': [
        ',',
        {
          Ref: 'QuickSightVpcConnectionSubnetParam',
        },
      ],
    },
  }, 1);

  template.resourcePropertiesCountIs('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'quicksight.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
    Description: 'IAM role use to create QuickSight VPC connection.',
  }, 1);

  template.resourcePropertiesCountIs('AWS::Lambda::Function', {
    Code: Match.anyValue(),
    Role: {
      'Fn::GetAtt': [
        Match.stringLikeRegexp('QuicksightCustomResourceProviderframeworkonEventServiceRole[A-Z0-9]+'),
        'Arn',
      ],
    },
    Environment: {
      Variables: {
        USER_ON_EVENT_FUNCTION_ARN: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('QuicksightCustomResourceLambda[A-Z0-9]+'),
            'Arn',
          ],
        },
      },
    },
    Handler: 'framework.onEvent',
    Timeout: 900,
  }, 1);

  template.resourcePropertiesCountIs('AWS::Logs::LogGroup', {
    RetentionInDays: 7,
  }, 2);

  template.resourcePropertiesCountIs('AWS::QuickSight::Template',
    {
      AwsAccountId: {
        Ref: 'AWS::AccountId',
      },
      Definition: {
        'Fn::If': [
          'useSpiceCondition',
          Match.anyValue(),
          Match.anyValue(),
        ],
      },
      Permissions: [
        {
          Actions: [
            'quicksight:UpdateTemplatePermissions',
            'quicksight:DescribeTemplatePermissions',
            'quicksight:DescribeTemplate',
            'quicksight:DeleteTemplate',
            'quicksight:UpdateTemplate',
          ],
          Principal: {
            Ref: 'QuickSightOwnerPrincipalParam',
          },
        },
      ],
      TemplateId: {
        'Fn::Join': [
          '',
          [
            'clickstream_template_',
            {
              Ref: 'RedshiftDBParam',
            },
            '_',
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
    }, 1);

  template.resourcePropertiesCountIs('AWS::QuickSight::DataSource', {
    AwsAccountId: {
      Ref: 'AWS::AccountId',
    },
    Credentials: {
      CredentialPair: {
        Password: {
          'Fn::Join': [
            '',
            [
              '{{resolve:secretsmanager:arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':secretsmanager:',
              {
                Ref: 'AWS::Region',
              },
              ':',
              {
                Ref: 'AWS::AccountId',
              },
              ':secret:',
              {
                Ref: 'RedshiftParameterKeyParam',
              },
              ':SecretString:password::}}',
            ],
          ],
        },
        Username: {
          'Fn::Join': [
            '',
            [
              '{{resolve:secretsmanager:arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':secretsmanager:',
              {
                Ref: 'AWS::Region',
              },
              ':',
              {
                Ref: 'AWS::AccountId',
              },
              ':secret:',
              {
                Ref: 'RedshiftParameterKeyParam',
              },
              ':SecretString:username::}}',
            ],
          ],
        },
      },
    },
    DataSourceId: {
      'Fn::Join': [
        '',
        [
          'clickstream_datasource_',
          {
            Ref: 'RedshiftDBParam',
          },
          '_',
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
    DataSourceParameters: {
      RedshiftParameters: {
        Database: {
          Ref: 'RedshiftDefaultDBParam',
        },
        Host: {
          Ref: 'RedshiftEndpointParam',
        },
        Port: {
          Ref: 'RedshiftPortParam',
        },
      },
    },
    Name: {
      'Fn::Join': [
        '',
        [
          'Clickstream DataSource ',
          {
            Ref: 'RedshiftDBParam',
          },
        ],
      ],
    },
    Type: 'REDSHIFT',
    VpcConnectionProperties: {
      VpcConnectionArn: {
        'Fn::GetAtt': [
          'ClickstreamVPCConnectionResource',
          'Arn',
        ],
      },
    },
  }, 1);

  template.resourcePropertiesCountIs('AWS::CloudFormation::CustomResource',
    {
      ServiceToken:
      {
        'Fn::GetAtt':
          [
            'QuicksightCustomResourceProviderframeworkonEvent9676AE66',
            'Arn',
          ],
      },
      awsAccountId:
      {
        Ref: 'AWS::AccountId',
      },
      awsRegion:
      {
        Ref: 'AWS::Region',
      },
      awsPartition:
      {
        Ref: 'AWS::Partition',
      },
      quickSightNamespace:
      {
        Ref: 'QuickSightNamespaceParam',
      },
      quickSightUser:
      {
        Ref: 'QuickSightUserParam',
      },
      quickSightSharePrincipalArn:
      {
        Ref: 'QuickSightOwnerPrincipalParam',
      },
      quickSightOwnerPrincipalArn:
      {
        Ref: 'QuickSightOwnerPrincipalParam',
      },
      schemas:
      {
        Ref: 'RedShiftDBSchemaParam',
      },
      dashboardDefProps:
      {
        analysisName: 'Clickstream Analysis',
        dashboardName: 'Clickstream Dashboard',
        templateArn:
          {
            'Fn::GetAtt':
              [
                'ClickstreamTemplateDef',
                'Arn',
              ],
          },
        templateId:
          {
            'Fn::Join':
              [
                '',
                [
                  'clickstream_template_',
                  {
                    Ref: 'RedshiftDBParam',
                  },
                  '_',
                  {
                    'Fn::Select':
                          [
                            0,
                            {
                              'Fn::Split':
                                  [
                                    '-',
                                    {
                                      'Fn::Select':
                                          [
                                            2,
                                            {
                                              'Fn::Split':
                                                  [
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
        dataSourceArn:
          {
            'Fn::GetAtt':
              [
                'ClickstreamDataSource',
                'Arn',
              ],
          },
        databaseName:
          {
            Ref: 'RedshiftDBParam',
          },
        dataSets:
          [
            {
              tableName: 'Event_View',
              useSpice: 'no',
              customSql: "\n        select \n          \n    *, \n    DATE_TRUNC('second', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) ::timestamp AS event_timestamp_local,\n    DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) ::timestamp AS event_date\n   \n        from {{schema}}.clickstream_event_view_v3\n        where DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) >= <<$startDate01>>\n        and DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) < DATEADD(DAY, 1, date_trunc('day', <<$endDate01>>))\n      ",
              columns:
                  [
                    {
                      Name: 'event_timestamp',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'event_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'event_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_pseudo_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_value',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_value_currency',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_bundle_sequence_id',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'ingest_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_mobile_brand_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_mobile_model_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_manufacturer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_carrier',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_network_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_operating_system',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_operating_system_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_vendor_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_advertising_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_system_language',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_time_zone_offset_seconds',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_ua_os',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_os_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_screen_width',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_screen_height',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_viewport_width',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_viewport_height',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_ua_string',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_continent',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_sub_continent',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_country',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_region',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_metro',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_city',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_locale',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_first_touch_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'app_package_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_install_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'project_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_unique_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_unique_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'screen_view_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'screen_view_entrances',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_referrer_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_previous_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'page_view_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'page_view_page_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_url',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_url_path',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_hostname',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_latest_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_latest_referrer_host',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_entrances',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_start_is_first_time',
                      Type: 'STRING',
                    },
                    {
                      Name: 'upgrade_previous_app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'upgrade_previous_os_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'search_key',
                      Type: 'STRING',
                    },
                    {
                      Name: 'search_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_classes',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_domain',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_url',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'scroll_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'sdk_error_code',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_error_message',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_exception_message',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_exception_stack',
                      Type: 'STRING',
                    },
                    {
                      Name: 'custom_parameters_json_str',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_duration',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_number',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_start_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_source_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_touch_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'first_visit_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'first_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_app_install_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_properties_json_str',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'latest_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_user_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_session_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_event_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'is_first_day_event',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_timestamp_local',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate01',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate01',
                      timeGranularity: 'DAY',
                    },
                  ],
              tagColumnOperations:
                  [
                    {
                      columnName: 'geo_country',
                      columnGeographicRoles:
                          [
                            'COUNTRY',
                          ],
                    },
                    {
                      columnName: 'geo_city',
                      columnGeographicRoles:
                          [
                            'CITY',
                          ],
                    },
                    {
                      columnName: 'geo_region',
                      columnGeographicRoles:
                          [
                            'STATE',
                          ],
                    },
                  ],
              projectedColumns:
                  [
                    'event_timestamp',
                    'event_id',
                    'event_time_msec',
                    'event_name',
                    'user_pseudo_id',
                    'session_id',
                    'event_value',
                    'event_value_currency',
                    'event_bundle_sequence_id',
                    'ingest_time_msec',
                    'device_mobile_brand_name',
                    'device_mobile_model_name',
                    'device_manufacturer',
                    'device_carrier',
                    'device_network_type',
                    'device_operating_system',
                    'device_operating_system_version',
                    'device_vendor_id',
                    'device_advertising_id',
                    'device_system_language',
                    'device_time_zone_offset_seconds',
                    'device_ua_os',
                    'device_ua_os_version',
                    'device_ua_browser',
                    'device_ua_browser_version',
                    'device_ua_device',
                    'device_ua_device_category',
                    'device_screen_width',
                    'device_screen_height',
                    'device_viewport_width',
                    'device_viewport_height',
                    'device_ua_string',
                    'geo_continent',
                    'geo_sub_continent',
                    'geo_country',
                    'geo_region',
                    'geo_metro',
                    'geo_city',
                    'geo_locale',
                    'traffic_source_source',
                    'traffic_source_medium',
                    'traffic_source_campaign',
                    'traffic_source_content',
                    'traffic_source_term',
                    'traffic_source_campaign_id',
                    'traffic_source_clid_platform',
                    'traffic_source_clid',
                    'traffic_source_channel_group',
                    'traffic_source_category',
                    'user_first_touch_time_msec',
                    'app_package_id',
                    'app_version',
                    'app_title',
                    'app_install_source',
                    'project_id',
                    'platform',
                    'app_id',
                    'screen_view_screen_name',
                    'screen_view_screen_id',
                    'screen_view_screen_unique_id',
                    'screen_view_previous_screen_name',
                    'screen_view_previous_screen_id',
                    'screen_view_previous_screen_unique_id',
                    'screen_view_previous_time_msec',
                    'screen_view_engagement_time_msec',
                    'screen_view_entrances',
                    'page_view_page_referrer',
                    'page_view_page_referrer_title',
                    'page_view_previous_time_msec',
                    'page_view_engagement_time_msec',
                    'page_view_page_title',
                    'page_view_page_url',
                    'page_view_page_url_path',
                    'page_view_hostname',
                    'page_view_latest_referrer',
                    'page_view_latest_referrer_host',
                    'page_view_entrances',
                    'app_start_is_first_time',
                    'upgrade_previous_app_version',
                    'upgrade_previous_os_version',
                    'search_key',
                    'search_term',
                    'outbound_link_classes',
                    'outbound_link_domain',
                    'outbound_link_id',
                    'outbound_link_url',
                    'outbound_link',
                    'user_engagement_time_msec',
                    'scroll_engagement_time_msec',
                    'sdk_error_code',
                    'sdk_error_message',
                    'sdk_version',
                    'sdk_name',
                    'app_exception_message',
                    'app_exception_stack',
                    'custom_parameters_json_str',
                    'session_duration',
                    'session_number',
                    'session_start_time_msec',
                    'session_source',
                    'session_medium',
                    'session_campaign',
                    'session_content',
                    'session_term',
                    'session_campaign_id',
                    'session_clid_platform',
                    'session_clid',
                    'session_channel_group',
                    'session_source_category',
                    'user_id',
                    'first_touch_time_msec',
                    'first_visit_date',
                    'first_referrer',
                    'first_traffic_category',
                    'first_traffic_source',
                    'first_traffic_medium',
                    'first_traffic_campaign',
                    'first_traffic_content',
                    'first_traffic_term',
                    'first_traffic_campaign_id',
                    'first_traffic_clid_platform',
                    'first_traffic_clid',
                    'first_traffic_channel_group',
                    'first_app_install_source',
                    'user_properties_json_str',
                    'merged_user_id',
                    'latest_user_id',
                    'new_user_indicator',
                    'view_session_indicator',
                    'view_event_indicator',
                    'is_first_day_event',
                    'event_timestamp_local',
                    'event_date',
                  ],
            },
            {
              tableName: 'Last_Refresh_Date',
              useSpice: 'no',
              customSql: "SELECT max(refresh_date) as \"Latest refresh date\" FROM {{schema}}.refresh_mv_sp_status where triggerred_by = 'WORK_FLOW'",
              columns:
                  [
                    {
                      Name: 'Latest refresh date',
                      Type: 'DATETIME',
                    },
                  ],
              projectedColumns:
                  [
                    'Latest refresh date',
                  ],
            },
            {
              tableName: 'Day_User_View',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_acquisition_day_user_view_cnt where event_date >= <<$startDate02>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate02>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'active_users',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_users',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate02',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate02',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'active_users',
                    'new_users',
                    'view_count',
                  ],
            },
            {
              tableName: 'Day_Traffic_Source_User',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_acquisition_day_traffic_source_user where event_date >= <<$startDate05>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate05>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate05',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate05',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_dim',
                    'aggregation_type',
                    'user_id',
                  ],
            },
            {
              tableName: 'Day_User_Acquisition',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_acquisition_day_user_acquisition where event_date >= <<$startDate07>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate07>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_user_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'engagement_session_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'engagement_rate',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'total_user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate07',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate07',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'aggregation_type',
                    'aggregation_dim',
                    'platform',
                    'new_user_count',
                    'session_count',
                    'engagement_session_count',
                    'engagement_rate',
                    'total_user_engagement_time_seconds',
                    'avg_user_engagement_time_seconds',
                    'event_count',
                    'user_id',
                  ],
            },
            {
              tableName: 'Country_New_User',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_acquisition_country_new_user where event_date >= <<$startDate08>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate08>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_country',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_city',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate08',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate08',
                      timeGranularity: 'DAY',
                    },
                  ],
              tagColumnOperations:
                  [
                    {
                      columnName: 'geo_country',
                      columnGeographicRoles:
                          [
                            'COUNTRY',
                          ],
                    },
                    {
                      columnName: 'geo_city',
                      columnGeographicRoles:
                          [
                            'CITY',
                          ],
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'geo_country',
                    'geo_city',
                    'user_count',
                  ],
            },
            {
              tableName: 'Intra_Day_User',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_acquisition_intra_day_user_mv where event_date >= date_trunc('day', <<$endDate23>>) and event_date < DATEADD(DAY, 2, date_trunc('day', <<$endDate23>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'active_users',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_users',
                      Type: 'STRING',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'endDate23',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'active_users',
                    'new_users',
                  ],
            },
            {
              tableName: 'Day_Event_View_Engagement',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_day_event_view where event_date >= <<$startDate09>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate09>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate09',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate09',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'event_count',
                    'view_count',
                  ],
            },
            {
              tableName: 'Engagement_KPI',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_kpi where event_date >= <<$startDate10>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate10>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'avg_engaged_session_per_user',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_engagement_time_per_session_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_engagement_time_per_user_seconds',
                      Type: 'DECIMAL',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate10',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate10',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'avg_engaged_session_per_user',
                    'avg_engagement_time_per_session_seconds',
                    'avg_engagement_time_per_user_seconds',
                  ],
            },
            {
              tableName: 'Page_Screen_View',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_page_screen_view where event_date >= <<$startDate11>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate11>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate11',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate11',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'view_count',
                  ],
            },
            {
              tableName: 'Page_Screen_View_Detail',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_page_screen_view_detail where event_date >= <<$startDate12>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate12>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate12',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate12',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'user_id',
                    'user_engagement_time_seconds',
                    'event_count',
                    'view_count',
                    'session_count',
                  ],
            },
            {
              tableName: 'Entrance',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_entrance where event_date >= <<$startDate13>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate13>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'entrance_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate13',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate13',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'entrance_count',
                  ],
            },
            {
              tableName: 'Exit',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_exit where event_date >= <<$startDate14>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate14>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'exit_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate14',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate14',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'exit_count',
                  ],
            },
            {
              tableName: 'Event_Name',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_engagement_event_name where event_date >= <<$startDate22>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate22>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_value',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate22',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate22',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'user_id',
                    'event_name',
                    'event_value',
                    'event_count',
                  ],
            },
            {
              tableName: 'User_New_Return',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_retention_user_new_return where event_date >= <<$startDate15>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate15>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate15',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate15',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'user_type',
                    'user_count',
                  ],
            },
            {
              tableName: 'Event_Overtime',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_retention_event_overtime where event_date >= <<$startDate16>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate16>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate16',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate16',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'event_count',
                  ],
            },
            {
              tableName: 'DAU_WAU',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_retention_dau_wau where event_date >= <<$startDate17>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate17>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate17',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate17',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'merged_user_id',
                  ],
            },
            {
              tableName: 'Retention_View',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_retention_view_v3 where first_date >= <<$startDate19>> and first_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate19>>))",
              columns:
                  [
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'day_diff',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'returned_user_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'total_users',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate19',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate19',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'platform',
                    'first_date',
                    'day_diff',
                    'returned_user_count',
                    'total_users',
                  ],
            },
            {
              tableName: 'Lifecycle_Weekly_View',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_lifecycle_weekly_view_v3 where time_period >= <<$startDate20>> and time_period < DATEADD(DAY, 1, date_trunc('day', <<$endDate20>>))",
              columns:
                  [
                    {
                      Name: 'time_period',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'this_week_value',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sum',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate20',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate20',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'time_period',
                    'platform',
                    'this_week_value',
                    'sum',
                  ],
            },
            {
              tableName: 'Crash_Rate',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_device_crash_rate where event_date >= <<$startDate18>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate18>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'crashed_user_id',
                      Type: 'STRING',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate18',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate18',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'app_version',
                    'merged_user_id',
                    'crashed_user_id',
                  ],
            },
            {
              tableName: 'Device',
              useSpice: 'no',
              customSql: "SELECT * FROM {{schema}}.clickstream_device_user_device where event_date >= <<$startDate21>> and event_date < DATEADD(DAY, 1, date_trunc('day', <<$endDate21>>))",
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'operating_system',
                      Type: 'STRING',
                    },
                    {
                      Name: 'operating_system_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_screen_resolution',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate21',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate21',
                      timeGranularity: 'DAY',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'device',
                    'app_version',
                    'user_id',
                    'operating_system',
                    'operating_system_version',
                    'device_ua_browser',
                    'device_screen_resolution',
                    'device_ua_device',
                    'device_ua_device_category',
                    'event_count',
                  ],
            },
          ],
        dataSetsSpice:
          [
            {
              tableName: 'Event_View',
              useSpice: 'no',
              customSql: "\n        select \n          \n    *, \n    DATE_TRUNC('second', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) ::timestamp AS event_timestamp_local,\n    DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) ::timestamp AS event_date\n   \n        from {{schema}}.clickstream_event_view_v3\n        where DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) >= <<$startDate01>>\n        and DATE_TRUNC('day', CONVERT_TIMEZONE('{{{timezone}}}', event_timestamp)) < DATEADD(DAY, 1, date_trunc('day', <<$endDate01>>))\n      ",
              columns:
                  [
                    {
                      Name: 'event_timestamp',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'event_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'event_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_pseudo_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_value',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_value_currency',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_bundle_sequence_id',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'ingest_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_mobile_brand_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_mobile_model_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_manufacturer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_carrier',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_network_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_operating_system',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_operating_system_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_vendor_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_advertising_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_system_language',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_time_zone_offset_seconds',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_ua_os',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_os_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_screen_width',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_screen_height',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_viewport_width',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_viewport_height',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'device_ua_string',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_continent',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_sub_continent',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_country',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_region',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_metro',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_city',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_locale',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'traffic_source_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_first_touch_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'app_package_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_install_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'project_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_screen_unique_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_screen_unique_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'screen_view_previous_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'screen_view_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'screen_view_entrances',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_referrer_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_previous_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'page_view_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'page_view_page_title',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_url',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_page_url_path',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_hostname',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_latest_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_latest_referrer_host',
                      Type: 'STRING',
                    },
                    {
                      Name: 'page_view_entrances',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_start_is_first_time',
                      Type: 'STRING',
                    },
                    {
                      Name: 'upgrade_previous_app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'upgrade_previous_os_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'search_key',
                      Type: 'STRING',
                    },
                    {
                      Name: 'search_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_classes',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_domain',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link_url',
                      Type: 'STRING',
                    },
                    {
                      Name: 'outbound_link',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'scroll_engagement_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'sdk_error_code',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_error_message',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sdk_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_exception_message',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_exception_stack',
                      Type: 'STRING',
                    },
                    {
                      Name: 'custom_parameters_json_str',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_duration',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_number',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_start_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'session_source_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_touch_time_msec',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'first_visit_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'first_referrer',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_medium',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_campaign',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_content',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_term',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_campaign_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_clid_platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_clid',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_traffic_channel_group',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_app_install_source',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_properties_json_str',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'latest_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_user_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_session_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_event_indicator',
                      Type: 'STRING',
                    },
                    {
                      Name: 'is_first_day_event',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_timestamp_local',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                  ],
              dateTimeDatasetParameter:
                  [
                    {
                      name: 'startDate01',
                      timeGranularity: 'DAY',
                    },
                    {
                      name: 'endDate01',
                      timeGranularity: 'DAY',
                    },
                  ],
              tagColumnOperations:
                  [
                    {
                      columnName: 'geo_country',
                      columnGeographicRoles:
                          [
                            'COUNTRY',
                          ],
                    },
                    {
                      columnName: 'geo_city',
                      columnGeographicRoles:
                          [
                            'CITY',
                          ],
                    },
                    {
                      columnName: 'geo_region',
                      columnGeographicRoles:
                          [
                            'STATE',
                          ],
                    },
                  ],
              projectedColumns:
                  [
                    'event_timestamp',
                    'event_id',
                    'event_time_msec',
                    'event_name',
                    'user_pseudo_id',
                    'session_id',
                    'event_value',
                    'event_value_currency',
                    'event_bundle_sequence_id',
                    'ingest_time_msec',
                    'device_mobile_brand_name',
                    'device_mobile_model_name',
                    'device_manufacturer',
                    'device_carrier',
                    'device_network_type',
                    'device_operating_system',
                    'device_operating_system_version',
                    'device_vendor_id',
                    'device_advertising_id',
                    'device_system_language',
                    'device_time_zone_offset_seconds',
                    'device_ua_os',
                    'device_ua_os_version',
                    'device_ua_browser',
                    'device_ua_browser_version',
                    'device_ua_device',
                    'device_ua_device_category',
                    'device_screen_width',
                    'device_screen_height',
                    'device_viewport_width',
                    'device_viewport_height',
                    'device_ua_string',
                    'geo_continent',
                    'geo_sub_continent',
                    'geo_country',
                    'geo_region',
                    'geo_metro',
                    'geo_city',
                    'geo_locale',
                    'traffic_source_source',
                    'traffic_source_medium',
                    'traffic_source_campaign',
                    'traffic_source_content',
                    'traffic_source_term',
                    'traffic_source_campaign_id',
                    'traffic_source_clid_platform',
                    'traffic_source_clid',
                    'traffic_source_channel_group',
                    'traffic_source_category',
                    'user_first_touch_time_msec',
                    'app_package_id',
                    'app_version',
                    'app_title',
                    'app_install_source',
                    'project_id',
                    'platform',
                    'app_id',
                    'screen_view_screen_name',
                    'screen_view_screen_id',
                    'screen_view_screen_unique_id',
                    'screen_view_previous_screen_name',
                    'screen_view_previous_screen_id',
                    'screen_view_previous_screen_unique_id',
                    'screen_view_previous_time_msec',
                    'screen_view_engagement_time_msec',
                    'screen_view_entrances',
                    'page_view_page_referrer',
                    'page_view_page_referrer_title',
                    'page_view_previous_time_msec',
                    'page_view_engagement_time_msec',
                    'page_view_page_title',
                    'page_view_page_url',
                    'page_view_page_url_path',
                    'page_view_hostname',
                    'page_view_latest_referrer',
                    'page_view_latest_referrer_host',
                    'page_view_entrances',
                    'app_start_is_first_time',
                    'upgrade_previous_app_version',
                    'upgrade_previous_os_version',
                    'search_key',
                    'search_term',
                    'outbound_link_classes',
                    'outbound_link_domain',
                    'outbound_link_id',
                    'outbound_link_url',
                    'outbound_link',
                    'user_engagement_time_msec',
                    'scroll_engagement_time_msec',
                    'sdk_error_code',
                    'sdk_error_message',
                    'sdk_version',
                    'sdk_name',
                    'app_exception_message',
                    'app_exception_stack',
                    'custom_parameters_json_str',
                    'session_duration',
                    'session_number',
                    'session_start_time_msec',
                    'session_source',
                    'session_medium',
                    'session_campaign',
                    'session_content',
                    'session_term',
                    'session_campaign_id',
                    'session_clid_platform',
                    'session_clid',
                    'session_channel_group',
                    'session_source_category',
                    'user_id',
                    'first_touch_time_msec',
                    'first_visit_date',
                    'first_referrer',
                    'first_traffic_category',
                    'first_traffic_source',
                    'first_traffic_medium',
                    'first_traffic_campaign',
                    'first_traffic_content',
                    'first_traffic_term',
                    'first_traffic_campaign_id',
                    'first_traffic_clid_platform',
                    'first_traffic_clid',
                    'first_traffic_channel_group',
                    'first_app_install_source',
                    'user_properties_json_str',
                    'merged_user_id',
                    'latest_user_id',
                    'new_user_indicator',
                    'view_session_indicator',
                    'view_event_indicator',
                    'is_first_day_event',
                    'event_timestamp_local',
                    'event_date',
                  ],
            },
            {
              tableName: 'Last_Refresh_Date',
              useSpice: 'no',
              customSql: "SELECT max(refresh_date) as \"Latest refresh date\" FROM {{schema}}.refresh_mv_sp_status where triggerred_by = 'WORK_FLOW'",
              columns:
                  [
                    {
                      Name: 'Latest refresh date',
                      Type: 'DATETIME',
                    },
                  ],
              projectedColumns:
                  [
                    'Latest refresh date',
                  ],
            },
            {
              tableName: 'Day_User_View',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_acquisition_day_user_view_cnt ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'active_users',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_users',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'active_users',
                    'new_users',
                    'view_count',
                  ],
            },
            {
              tableName: 'Day_Traffic_Source_User',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_acquisition_day_traffic_source_user ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_dim',
                    'aggregation_type',
                    'user_id',
                  ],
            },
            {
              tableName: 'Day_User_Acquisition',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_acquisition_day_user_acquisition ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_user_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'engagement_session_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'engagement_rate',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'total_user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'aggregation_type',
                    'aggregation_dim',
                    'platform',
                    'new_user_count',
                    'session_count',
                    'engagement_session_count',
                    'engagement_rate',
                    'total_user_engagement_time_seconds',
                    'avg_user_engagement_time_seconds',
                    'event_count',
                    'user_id',
                  ],
            },
            {
              tableName: 'Country_New_User',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_acquisition_country_new_user',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_country',
                      Type: 'STRING',
                    },
                    {
                      Name: 'geo_city',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_count',
                      Type: 'INTEGER',
                    },
                  ],
              tagColumnOperations:
                  [
                    {
                      columnName: 'geo_country',
                      columnGeographicRoles:
                          [
                            'COUNTRY',
                          ],
                    },
                    {
                      columnName: 'geo_city',
                      columnGeographicRoles:
                          [
                            'CITY',
                          ],
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'geo_country',
                    'geo_city',
                    'user_count',
                  ],
            },
            {
              tableName: 'Intra_Day_User',
              useSpice: 'yes',
              refreshInterval: 'HOURLY',
              customSql: 'SELECT * FROM {{schema}}.clickstream_acquisition_intra_day_user_mv ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'active_users',
                      Type: 'STRING',
                    },
                    {
                      Name: 'new_users',
                      Type: 'STRING',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'active_users',
                    'new_users',
                  ],
            },
            {
              tableName: 'Day_Event_View_Engagement',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_day_event_view ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'event_count',
                    'view_count',
                  ],
            },
            {
              tableName: 'Engagement_KPI',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_kpi ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'avg_engaged_session_per_user',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_engagement_time_per_session_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'avg_engagement_time_per_user_seconds',
                      Type: 'DECIMAL',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'avg_engaged_session_per_user',
                    'avg_engagement_time_per_session_seconds',
                    'avg_engagement_time_per_user_seconds',
                  ],
            },
            {
              tableName: 'Page_Screen_View',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_page_screen_view ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'view_count',
                  ],
            },
            {
              tableName: 'Page_Screen_View_Detail',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_page_screen_view_detail ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_engagement_time_seconds',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'view_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'session_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'user_id',
                    'user_engagement_time_seconds',
                    'event_count',
                    'view_count',
                    'session_count',
                  ],
            },
            {
              tableName: 'Entrance',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_entrance ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'entrance_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'entrance_count',
                  ],
            },
            {
              tableName: 'Exit',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_exit ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'aggregation_dim',
                      Type: 'STRING',
                    },
                    {
                      Name: 'exit_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'aggregation_type',
                    'aggregation_dim',
                    'exit_count',
                  ],
            },
            {
              tableName: 'Event_Name',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_engagement_event_name ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_name',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_value',
                      Type: 'DECIMAL',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'user_id',
                    'event_name',
                    'event_value',
                    'event_count',
                  ],
            },
            {
              tableName: 'User_New_Return',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_retention_user_new_return ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_type',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'user_type',
                    'user_count',
                  ],
            },
            {
              tableName: 'Event_Overtime',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_retention_event_overtime ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'event_count',
                  ],
            },
            {
              tableName: 'DAU_WAU',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_retention_dau_wau ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'merged_user_id',
                  ],
            },
            {
              tableName: 'Retention_View',
              useSpice: 'yes',
              lookbackColumn: 'first_date',
              customSql: 'SELECT * FROM {{schema}}.clickstream_retention_view_v3 ',
              columns:
                  [
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'first_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'day_diff',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'returned_user_count',
                      Type: 'INTEGER',
                    },
                    {
                      Name: 'total_users',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'platform',
                    'first_date',
                    'day_diff',
                    'returned_user_count',
                    'total_users',
                  ],
            },
            {
              tableName: 'Lifecycle_Weekly_View',
              useSpice: 'yes',
              lookbackColumn: 'time_period',
              customSql: 'SELECT * FROM {{schema}}.clickstream_lifecycle_weekly_view_v3 ',
              columns:
                  [
                    {
                      Name: 'time_period',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'this_week_value',
                      Type: 'STRING',
                    },
                    {
                      Name: 'sum',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'time_period',
                    'platform',
                    'this_week_value',
                    'sum',
                  ],
            },
            {
              tableName: 'Crash_Rate',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_device_crash_rate ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'merged_user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'crashed_user_id',
                      Type: 'STRING',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'app_version',
                    'merged_user_id',
                    'crashed_user_id',
                  ],
            },
            {
              tableName: 'Device',
              useSpice: 'yes',
              customSql: 'SELECT * FROM {{schema}}.clickstream_device_user_device ',
              columns:
                  [
                    {
                      Name: 'event_date',
                      Type: 'DATETIME',
                    },
                    {
                      Name: 'platform',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'app_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'user_id',
                      Type: 'STRING',
                    },
                    {
                      Name: 'operating_system',
                      Type: 'STRING',
                    },
                    {
                      Name: 'operating_system_version',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_browser',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_screen_resolution',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device',
                      Type: 'STRING',
                    },
                    {
                      Name: 'device_ua_device_category',
                      Type: 'STRING',
                    },
                    {
                      Name: 'event_count',
                      Type: 'INTEGER',
                    },
                  ],
              projectedColumns:
                  [
                    'event_date',
                    'platform',
                    'device',
                    'app_version',
                    'user_id',
                    'operating_system',
                    'operating_system_version',
                    'device_ua_browser',
                    'device_screen_resolution',
                    'device_ua_device',
                    'device_ua_device_category',
                    'event_count',
                  ],
            },
          ],
      },
      timezone:
      {
        Ref: 'QuickSightTimezoneParam',
      },
      useSpice:
      {
        Ref: 'QuickSightUseSpiceParam',
      },
    }
    , 1);

  template.resourcePropertiesCountIs('AWS::CloudFormation::CustomResource',
    {
      ServiceToken: {
        'Fn::GetAtt': [
          'NetworkInterfaceCheckCustomResourceProviderframeworkonEvent123C1881',
          'Arn',
        ],
      },
      awsRegion: {
        Ref: 'AWS::Region',
      },
      networkInterfaces: {
        'Fn::GetAtt': [
          'ClickstreamVPCConnectionResource',
          'NetworkInterfaces',
        ],
      },
    }, 1);

  test('Should has ApplicationArnCondition', () => {
    template.hasCondition('ApplicationArnCondition', {
      'Fn::Not': [
        {
          'Fn::Equals': [
            {
              Ref: 'AppRegistryApplicationArn',
            },
            '',
          ],
        },
      ],
    });
  });

  test('Should has AppRegistryAssociation', () => {
    template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
      Application: {
        'Fn::Select': [
          2,
          {
            'Fn::Split': [
              '/',
              {
                'Fn::Select': [
                  5,
                  {
                    'Fn::Split': [
                      ':',
                      {
                        Ref: 'AppRegistryApplicationArn',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      Resource: {
        Ref: 'AWS::StackId',
      },
      ResourceType: 'CFN_STACK',
    });
  });

});