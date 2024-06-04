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
import { App } from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { IngestionServerStack } from '../../../src/ingestion-server-stack';
import { WIDGETS_ORDER } from '../../../src/metrics/settings';
import { validateSubnetsRule } from '../../rules';
import { findResourceByCondition, getParameter, getParameterNamesFromParameterObject } from '../../utils';

if (process.env.CI !== 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => require('../../cdk-lambda-nodejs-mock'));
}

const app = new App();

const kafkaStack = new IngestionServerStack(app, 'test-kafka-stack', {
  deliverToKafka: true,
  deliverToKinesis: false,
  deliverToS3: false,
});

const kinesisStack = new IngestionServerStack(app, 'test-kinesis-stack', {
  deliverToKafka: false,
  deliverToKinesis: true,
  deliverToS3: false,
});

const s3Stack = new IngestionServerStack(app, 'test-s3-stack', {
  deliverToKafka: false,
  deliverToKinesis: false,
  deliverToS3: true,
});

const kafkaTemplate = Template.fromStack(kafkaStack);
const kinesisTemplate = Template.fromStack(kinesisStack);
const s3Template = Template.fromStack(s3Stack);

const templates = [kafkaTemplate, kinesisTemplate, s3Template];

test('Has Parameter VpcId', () => {
  templates.forEach((template) =>
    template.hasParameter('VpcId', {
      Type: 'AWS::EC2::VPC::Id',
    }),
  );
});

test('Has Parameter PublicSubnetIds', () => {
  templates.forEach((template) =>
    template.hasParameter('PublicSubnetIds', {
      Type: 'String',
    }),
  );
});

test('PublicSubnetIds pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'PublicSubnetIds');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'subnet-a1234,subnet-b1234',
      'subnet-fffff1,subnet-fffff2,subnet-fffff3',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'subnet-a1234',
      'net-a1234,net-b1234',
      'subnet-g1234,subnet-g1234',
      'subnet-a1234, subnet-b1234',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('Has Rule to validate subnets in VPC', () => {
  templates.forEach((template) => {
    validateSubnetsRule(template);
  });
});

test('Has Parameter PrivateSubnetIds', () => {
  templates.forEach((template) => {
    template.hasParameter('PrivateSubnetIds', {
      Type: 'String',
    });
  });
});

test('PrivateSubnetIds pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'PrivateSubnetIds');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'subnet-a1234,subnet-b1234',
      'subnet-fffff1,subnet-fffff2,subnet-fffff3',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = [
      'subnet-a1234',
      'net-a1234,net-b1234',
      'subnet-g1234,subnet-g1234',
      'subnet-a1234, subnet-b1234',
    ];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('Has Parameter DomainName', () => {
  templates.forEach((template) => {
    template.hasParameter('DomainName', {
      Type: 'String',
    });
  });
});

test('Has Parameter ACMCertificateArn', () => {
  templates.forEach((template) => {
    template.hasParameter('ACMCertificateArn', {
      Type: 'String',
    });
  });
});

test('domainName pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'DomainName');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      'abc.com',
      'test.abc.com',
      'example.services',
      'test.example.graphics',
      '123.test.clickstream.management',
      '123.test.abc.com',
      'a123#~&%.test-2.a_bc.com',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = ['a', 'abc.example_test', 'abc.c', 'abc^.com'];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('Has Parameter ServerEndpointPath', () => {
  templates.forEach((template) => {
    template.hasParameter('ServerEndpointPath', {
      Type: 'String',
      Default: '/collect',
    });
  });
});

test('ServerEndpointPath pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'ServerEndpointPath');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = ['/a', '/a_b', '/a1', '/123', '/a/ab#', '/a/ab&'];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = ['a/b', '*', 'a', 'collect'];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('Has Parameter serverCorsOrigin', () => {
  templates.forEach((template) => {
    template.hasParameter('ServerCorsOrigin', {
      Type: 'String',
      Default: '',
    });
  });
});

test('ServerCorsOrigin pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'ServerCorsOrigin');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      '.*',
      'http://.*\\.test\\.com',
      'http://abc\\.test\\.com',
      'http://abc1\\.test\\.com|http://abc2\\.test\\.com|http://abc3\\.test\\.com',
      'http://abc1\\.test\\.com|http://abc2\\.test\\.com',
    ];

    for (const v of validValues) {
      expect(v).toMatch(regex);
    }

    const invalidValues = ['http://a', 'http://abc1.test.com; http://abc2.test.com'];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('Has Parameter Protocol', () => {
  templates.forEach((template) => {
    template.hasParameter('Protocol', {
      Type: 'String',
      Default: 'HTTP',
    });
  });
});

test('Has Parameter EnableApplicationLoadBalancerAccessLog', () => {
  templates.forEach((template) => {
    template.hasParameter('EnableApplicationLoadBalancerAccessLog', {
      Type: 'String',
      Default: 'No',
    });
  });
});

test('Has Parameter EnableGlobalAccelerator', () => {
  templates.forEach((template) => {
    template.hasParameter('EnableGlobalAccelerator', {
      Type: 'String',
      Default: 'No',
    });
  });
});

test('Has Parameter EnableAuthentication', () => {
  templates.forEach((template) => {
    template.hasParameter('EnableAuthentication', {
      Type: 'String',
      Default: 'No',
    });
  });
});

test('Has Parameter AuthenticationSecretArn', () => {
  templates.forEach((template) => {
    template.hasParameter('AuthenticationSecretArn', {
      Type: 'String',
    });
  });
});

test('Has Parameter LogS3Bucket', () => {
  templates.forEach((template) => {
    template.hasParameter('LogS3Bucket', {
      Type: 'String',
      Default: '',
    });
  });
});

test('Has Parameter LogS3Prefix', () => {
  templates.forEach((template) => {
    template.hasParameter('LogS3Prefix', {
      Type: 'String',
      Default: 'ingestion-server-log/',
    });
  });
});

test('Has Parameter NotificationsTopicArn', () => {
  templates.forEach((template) => {
    template.hasParameter('NotificationsTopicArn', {
      Type: 'String',
      Default: '',
    });
  });
});

test('Has Parameter KafkaBrokers', () => {
  kafkaTemplate.hasParameter('KafkaBrokers', {
    Type: 'String',
    Default: '',
  });
});

test('KafkaBrokers pattern', () => {
  const param = getParameter(kafkaTemplate, 'KafkaBrokers');
  const pattern = param.AllowedPattern;
  const regex = new RegExp(`${pattern}`);
  const validValues = [
    'b1.test.com:9092',
    'b-1.test.com:9092,b-2.test.com:9092',
    'b-1.test.com:9092,b-2.test.com:9092,b-3.test.com:9092',
    '192.169.1.1:9092,192.169.1.2:9092,192.169.1.3:9092',
  ];

  for (const v of validValues) {
    expect(v).toMatch(regex);
  }

  const invalidValues = [
    'a',
    'b1.test.com:abc',
    'b1.test.com',
    'b-1.test.com,b-2.test.com:9092',
    '192.169.1.1,192.169.1.2,192.169.1.3',
    '192.169.1.1',
    '192.169.1.1:9092,192.169.1.2',
  ];
  for (const v of invalidValues) {
    expect(v).not.toMatch(regex);
  }
});

test('Has Parameter KafkaTopic', () => {
  kafkaTemplate.hasParameter('KafkaTopic', {
    Type: 'String',
    Default: '',
  });
});

test('KafkaTopic pattern', () => {
  const param = getParameter(kafkaTemplate, 'KafkaTopic');
  const pattern = param.AllowedPattern;
  const regex = new RegExp(`${pattern}`);
  const validValues = ['test1', 'test-abc.ab_ab', ''];

  for (const v of validValues) {
    expect(v).toMatch(regex);
  }

  const invalidValues = ['abc%', 'a#', 'a,b'];
  for (const v of invalidValues) {
    expect(v).not.toMatch(regex);
  }
});

test('Has Parameter MskSecurityGroupId', () => {
  kafkaTemplate.hasParameter('MskSecurityGroupId', {
    Type: 'String',
    Default: '',
  });
});

test('MskSecurityGroupId pattern', () => {
  const param = getParameter(kafkaTemplate, 'MskSecurityGroupId');
  const pattern = param.AllowedPattern;
  const regex = new RegExp(`${pattern}`);
  const validValues = ['sg-124434ab', 'sg-ffffff', 'sg-00000', ''];
  for (const v of validValues) {
    expect(v).toMatch(regex);
  }

  const invalidValues = ['sg-test1', 'abc', 'mysg-12323'];
  for (const v of invalidValues) {
    expect(v).not.toMatch(regex);
  }
});

test('Has Parameter MskClusterName', () => {
  kafkaTemplate.hasParameter('MskClusterName', {
    Type: 'String',
    Default: '',
  });
});

test('Has Parameter ServerMin', () => {
  templates.forEach((template) => {
    template.hasParameter('ServerMin', {
      Type: 'Number',
      Default: '2',
    });
  });
});

test('Has Parameter ServerMax', () => {
  templates.forEach((template) => {
    template.hasParameter('ServerMax', {
      Type: 'Number',
      Default: '2',
    });
  });
});

test('Has Parameter WarmPoolSize', () => {
  templates.forEach((template) => {
    template.hasParameter('WarmPoolSize', {
      Type: 'Number',
      Default: '0',
    });
  });
});

test('Has Parameter ScaleOnCpuUtilizationPercent', () => {
  templates.forEach((template) => {
    template.hasParameter('ScaleOnCpuUtilizationPercent', {
      Type: 'Number',
      Default: '50',
    });
  });
});

test('Has Parameter KinesisDataS3Bucket', () => {
  kinesisTemplate.hasParameter('KinesisDataS3Bucket', {
    Type: 'String',
    Default: '',
  });
});

test('Has Parameter KinesisDataS3Prefix', () => {
  kinesisTemplate.hasParameter('KinesisDataS3Prefix', {
    Type: 'String',
    Default: 'kinesis-data/',
  });
});

test('Has Parameter KinesisStreamMode', () => {
  kinesisTemplate.hasParameter('KinesisStreamMode', {
    Type: 'String',
    Default: 'ON_DEMAND',
  });
});

test('Has Parameter KinesisShardCount', () => {
  kinesisTemplate.hasParameter('KinesisShardCount', {
    Type: 'Number',
    Default: '3',
  });
});

test('Has Parameter KinesisDataRetentionHours', () => {
  kinesisTemplate.hasParameter('KinesisDataRetentionHours', {
    Type: 'Number',
    Default: '24',
    MinValue: 24,
    MaxValue: 8760,
  });
});

test('Has Parameter KinesisBatchSize', () => {
  kinesisTemplate.hasParameter('KinesisBatchSize', {
    Type: 'Number',
    Default: '10000',
    MinValue: 1,
    MaxValue: 10000,
  });
});

test('Has Parameter KinesisMaxBatchingWindowSeconds', () => {
  kinesisTemplate.hasParameter('KinesisMaxBatchingWindowSeconds', {
    Type: 'Number',
    Default: '300',
    MinValue: 0,
    MaxValue: 300,
  });
});

test('Has Parameter S3DataBucket', () => {
  s3Template.hasParameter('S3DataBucket', {
    Type: 'String',
    Default: '',
  });
});

test('Has Parameter S3DataPrefix', () => {
  s3Template.hasParameter('S3DataPrefix', {
    Type: 'String',
    Default: 's3-data/',
  });
});

test('Has Parameter S3BatchMaxBytes', () => {
  s3Template.hasParameter('S3BatchMaxBytes', {
    Type: 'Number',
    Default: '30000000',
    MaxValue: 50000000,
    MinValue: 1000000,
  });
});

test('Has Parameter S3BatchTimeout', () => {
  s3Template.hasParameter('S3BatchTimeout', {
    Type: 'Number',
    Default: '300',
    MinValue: 30,
  });
});

test('Has ParameterGroups', () => {
  templates.forEach((template) => {
    const cfnInterface =
      template.toJSON().Metadata['AWS::CloudFormation::Interface'];
    expect(cfnInterface.ParameterGroups).toBeDefined();
  });
});

test('Check parameters for Kafka nested stack - has all parameters', () => {
  const nestStack = findResourceByCondition(
    kafkaTemplate,
    'IngestionServerM11C1111Condition',
  );
  expect(nestStack).toBeDefined();

  const exceptedParams = [
    'MskSecurityGroupId',
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'NotificationsTopicArn',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'KafkaBrokers',
    'KafkaTopic',
    'MskClusterName',
    'VpcId',
    'IamRoleBoundaryArn',
    'DomainName',
    'ACMCertificateArn',
    'LogS3Bucket',
    'LogS3Prefix',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'EnableGlobalAccelerator',
    'DevMode',
    'AuthenticationSecretArn',
    'ProjectId',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];
  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );

  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length);
});

test('Check parameters for Kafka nested stack - has minimum parameters', () => {
  const nestStack = findResourceByCondition(
    kafkaTemplate,
    'IngestionServerM00C0000Condition',
  );
  expect(nestStack).toBeDefined();

  const exceptedParams = [
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'VpcId',
    'IamRoleBoundaryArn',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'KafkaBrokers',
    'KafkaTopic',
    'EnableGlobalAccelerator',
    'DevMode',
    'ProjectId',
    'DomainName',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];

  console.log('');
  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );
  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length);
});

test('Check parameters for Kinesis nested stack - has all parameters', () => {
  const nestStack = findResourceByCondition(
    kinesisTemplate,
    'IngestionServerK1C1111Condition',
  );
  expect(nestStack).toBeDefined();

  const exceptedParams = [
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'NotificationsTopicArn',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'VpcId',
    'IamRoleBoundaryArn',
    'DomainName',
    'ACMCertificateArn',
    'LogS3Bucket',
    'LogS3Prefix',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'EnableGlobalAccelerator',
    'DevMode',
    'AuthenticationSecretArn',
    'ProjectId',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];

  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );
  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length + 1);
});

test('Check parameters for Kinesis nested stack - has minimum parameters', () => {
  const nestStack = findResourceByCondition(
    kinesisTemplate,
    'IngestionServerK2C0000Condition',
  );
  expect(nestStack).toBeDefined();

  const exceptedParams = [
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'VpcId',
    'IamRoleBoundaryArn',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'EnableGlobalAccelerator',
    'DevMode',
    'ProjectId',
    'DomainName',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];

  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );
  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length + 1);
});

test('Check parameters for S3 nested stack - has all parameters', () => {
  const nestStack = findResourceByCondition(
    s3Template,
    'IngestionServerC1111Condition',
  );
  expect(nestStack).toBeDefined();
  const exceptedParams = [
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'NotificationsTopicArn',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'VpcId',
    'IamRoleBoundaryArn',
    'DomainName',
    'ACMCertificateArn',
    'LogS3Bucket',
    'LogS3Prefix',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'S3DataBucket',
    'S3DataPrefix',
    'S3BatchMaxBytes',
    'S3BatchTimeout',
    'EnableGlobalAccelerator',
    'DevMode',
    'AuthenticationSecretArn',
    'ProjectId',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];

  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );
  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length);
});

test('Check parameters for S3 nested stack - has minimum parameters', () => {
  const nestStack = findResourceByCondition(
    s3Template,
    'IngestionServerC0000Condition',
  );
  expect(nestStack).toBeDefined();
  const exceptedParams = [
    'ServerMax',
    'ServerMin',
    'WarmPoolSize',
    'PrivateSubnetIds',
    'ServerEndpointPath',
    'ServerCorsOrigin',
    'VpcId',
    'IamRoleBoundaryArn',
    'PublicSubnetIds',
    'ScaleOnCpuUtilizationPercent',
    'S3DataBucket',
    'S3DataPrefix',
    'S3BatchMaxBytes',
    'S3BatchTimeout',
    'EnableGlobalAccelerator',
    'DevMode',
    'ProjectId',
    'DomainName',
    'AppIds',
    'ClickStreamSDK',
    'WorkerStopTimeout',
  ];

  const templateParams = Object.keys(nestStack.Properties.Parameters).map(
    (pk) => {
      if (nestStack.Properties.Parameters[pk].Ref) {
        return nestStack.Properties.Parameters[pk].Ref;
      }
    },
  );
  for (const ep of exceptedParams) {
    expect(templateParams.includes(ep)).toBeTruthy();
  }
  expect(templateParams.length).toEqual(exceptedParams.length);
});

test('Conditions are created as expected', () => {
  templates.forEach((template) => {
    const conditionObj = template.toJSON().Conditions;
    const allConditions = Object.keys(conditionObj)
      .filter((ck) => ck.startsWith('IngestionServer'))
      .map((ck) => {
        return {
          cItems: (conditionObj[ck]['Fn::And'] as any[]).map(
            (it) => it.Condition,
          ),
          cKey: ck,
        };
      });
    for (const c of allConditions) {
      const binStr = c.cItems
        .map((it) => {
          if ((it as string) === 'onDemandStackCondition') {
            return 1;
          }
          if ((it as string) === 'provisionedStackCondition') {
            return 2;
          }
          if ((it as string).endsWith('Neg')) {
            return 0;
          } else {
            return 1;
          }
        })
        .join('');
      // IngestionServerK1C100Condition => 1100
      const expectedBinStr = c.cKey.replace(new RegExp(/[^\d]/g), '');
      expect(binStr).toEqual(expectedBinStr);
    }
  });
});

test('Rule logS3BucketAndEnableLogRule', () => {
  templates.forEach((template) => {
    const assert =
      template.toJSON().Rules.logS3BucketAndEnableLogRule.Assertions[0].Assert;

    let assertStr = JSON.stringify(assert).replace(/Fn::Or/g, 'or');
    assertStr = assertStr.replace(/Fn::And/g, 'and');
    assertStr = assertStr.replace(/Fn::Equals/g, 'eq');
    assertStr = assertStr.replace(/Fn::Not/g, 'not');

    const expectedAssert = {
      or: [
        {
          and: [
            {
              eq: [
                {
                  Ref: 'EnableApplicationLoadBalancerAccessLog',
                },
                'Yes',
              ],
            },

            {
              not: [
                {
                  eq: [
                    {
                      Ref: 'LogS3Bucket',
                    },
                    '',
                  ],
                },
              ],
            },

            {
              not: [
                {
                  eq: [
                    {
                      Ref: 'LogS3Prefix',
                    },
                    '',
                  ],
                },
              ],
            },
          ],
        },

        {
          eq: [
            {
              Ref: 'EnableApplicationLoadBalancerAccessLog',
            },
            'No',
          ],
        },
      ],
    };

    expect(JSON.parse(assertStr)).toEqual(expectedAssert);
  });
});

test('Rule enableAuthenticationRule', () => {
  templates.forEach((template) => {
    const assert =
      template.toJSON().Rules.enableAuthenticationRule.Assertions[0].Assert;

    let assertStr = JSON.stringify(assert).replace(/Fn::Or/g, 'or');
    assertStr = assertStr.replace(/Fn::And/g, 'and');
    assertStr = assertStr.replace(/Fn::Equals/g, 'eq');
    assertStr = assertStr.replace(/Fn::Not/g, 'not');

    const expectedAssert = {
      or: [
        {
          and: [
            {
              eq: [
                {
                  Ref: 'EnableAuthentication',
                },
                'Yes',
              ],
            },

            {
              not: [
                {
                  eq: [
                    {
                      Ref: 'AuthenticationSecretArn',
                    },
                    '',
                  ],
                },
              ],
            },

            {
              not: [
                {
                  eq: [
                    {
                      Ref: 'Protocol',
                    },
                    'HTTP',
                  ],
                },
              ],
            },
          ],
        },

        {
          eq: [
            {
              Ref: 'EnableAuthentication',
            },
            'No',
          ],
        },
      ],
    };

    expect(JSON.parse(assertStr)).toEqual(expectedAssert);
  });
});

test('Rule sinkToKinesisRule', () => {
  const assert =
    kinesisTemplate.toJSON().Rules.sinkToKinesisRule.Assertions[0].Assert;

  let assertStr = JSON.stringify(assert).replace(/Fn::Or/g, 'or');
  assertStr = assertStr.replace(/Fn::And/g, 'and');
  assertStr = assertStr.replace(/Fn::Equals/g, 'eq');
  assertStr = assertStr.replace(/Fn::Not/g, 'not');

  const expectedAssert = {
    and: [
      {
        not: [
          {
            eq: [
              {
                Ref: 'KinesisDataS3Bucket',
              },
              '',
            ],
          },
        ],
      },

      {
        not: [
          {
            eq: [
              {
                Ref: 'KinesisDataS3Prefix',
              },
              '',
            ],
          },
        ],
      },
    ],
  };
  expect(JSON.parse(assertStr)).toEqual(expectedAssert);
});

test('Parameters of onDemand Kinesis nested stack ', () => {
  const paramCapture = new Capture();
  kinesisTemplate.hasResource('AWS::CloudFormation::Stack', {
    Condition: 'onDemandStackCondition',
    Properties: {
      Parameters: paramCapture,
    },
  });
  const paramObj = paramCapture.asObject();
  const params = getParameterNamesFromParameterObject(paramObj);
  expect(params).toEqual([
    'ProjectId',
    'KinesisDataRetentionHours',
    'VpcId',
    'IamRoleBoundaryArn',
    'KinesisDataS3Bucket',
    'KinesisDataS3Prefix',
    'PrivateSubnetIds',
    'KinesisBatchSize',
    'KinesisMaxBatchingWindowSeconds',
  ]);
});

test('Parameters of provisioned Kinesis nested stack ', () => {
  const paramCapture = new Capture();
  kinesisTemplate.hasResource('AWS::CloudFormation::Stack', {
    Condition: 'provisionedStackCondition',
    Properties: {
      Parameters: paramCapture,
    },
  });
  const paramObj = paramCapture.asObject();
  const params = getParameterNamesFromParameterObject(paramObj);
  expect(params).toEqual([
    'ProjectId',
    'KinesisDataRetentionHours',
    'KinesisShardCount',
    'VpcId',
    'IamRoleBoundaryArn',
    'KinesisDataS3Bucket',
    'KinesisDataS3Prefix',
    'PrivateSubnetIds',
    'KinesisBatchSize',
    'KinesisMaxBatchingWindowSeconds',
  ]);
});

test('Environment variables name are as expected for Lambda::Function in kinesis nested stack', () => {
  expect(kinesisStack.kinesisNestedStacks).toBeDefined();
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ]
      .map((s) => Template.fromStack(s))
      .forEach((t) => {
        t.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              S3_BUCKET: {
                Ref: Match.anyValue(),
              },
              S3_PREFIX: {
                Ref: Match.anyValue(),
              },
            },
          },
        });
      });
  }
});

test('Each of kinesis nested templates has EventSourceMapping', () => {
  expect(kinesisStack.kinesisNestedStacks).toBeDefined();
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ]
      .map((s) => Template.fromStack(s))
      .forEach((t) => {
        t.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
          BatchSize: {
            Ref: Match.anyValue(),
          },
          Enabled: true,
          MaximumBatchingWindowInSeconds: {
            Ref: Match.anyValue(),
          },
        });
      });
  }
});

test('Each of kinesis nested templates has Kinesis::Stream', () => {
  expect(kinesisStack.kinesisNestedStacks).toBeDefined();
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ]
      .map((s) => Template.fromStack(s))
      .forEach((t) => {
        t.resourceCountIs('AWS::Kinesis::Stream', 1);
      });
  }
});


test('Lambda has POWERTOOLS ENV set', () => {
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ].forEach(stack => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            LOG_LEVEL: 'WARN',
            POWERTOOLS_SERVICE_NAME: 'ClickStreamAnalyticsOnAWS',
          },
        },
      });
    });
  }

});

test('Each of kinesis nested templates can handle multi subnets', () => {
  expect(kinesisStack.kinesisNestedStacks).toBeDefined();
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ]
      .map((s) => Template.fromStack(s))
      .forEach((t) => {
        t.hasResourceProperties('AWS::Lambda::Function', {
          VpcConfig: {
            SubnetIds: {
              'Fn::Split': [
                ',',
                {
                  Ref: Match.anyValue(),
                },
              ],
            },
          },
        });
      });
  }
});

test('S3DataPrefix pattern', () => {
  const param = getParameter(s3Template, 'S3DataPrefix');
  const pattern = param.AllowedPattern;
  const regex = new RegExp(`${pattern}`);
  const validValues = [
    '',
    'prefix/',
    'prefix/prefix/',
  ];

  for (const v of validValues) {
    expect(v).toMatch(regex);
  }

  const invalidValues = ['/prefix'];
  for (const v of invalidValues) {
    expect(v).not.toMatch(regex);
  }
});

test('check ACMCertificateArn pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'ACMCertificateArn');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      '',
      'arn:aws:acm:us-east-1:111111111111:certificate/fake',
      'arn:aws-cn:acm:cn-northwest-1:111111111111:certificate/fake',
      'arn:aws-us-gov:acm:us-gov-west-1:111111111111:certificate/fake',
    ];
    for (const v of validValues) {
      expect(v).toMatch(regex);
    }
    const invalidValues = ['abc', 'arn:aws-cx:acm:us-east-1:111111111111:certificate/fake', 'arn:aws:acme:us-east-1:111111111111:certificate/fake'];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});

test('check AuthenticationSecretArn pattern', () => {
  templates.forEach((template) => {
    const param = getParameter(template, 'AuthenticationSecretArn');
    const pattern = param.AllowedPattern;
    const regex = new RegExp(`${pattern}`);
    const validValues = [
      '',
      'arn:aws:secretsmanager:us-east-1:111111111111:secret:fake-xxxxxx',
      'arn:aws-cn:secretsmanager:cn-northwest-1:111111111111:secret:fake-xxxxxx',
      'arn:aws-us-gov:secretsmanager:us-gov-west-1:111111111111:secret:fake-xxxxxx',
      'arn:aws:secretsmanager:us-east-1:111111111111:secret:prefix/fake-xxxxxx',
    ];
    for (const v of validValues) {
      expect(v).toMatch(regex);
    }
    const invalidValues = ['abc', 'arn:aws-cx:secretsmanager:us-east-1:111111111111:secret:fake', 'arn:aws:secretsmanagers:us-east-1:111111111111:certificate/fake-xxxxxx'];
    for (const v of invalidValues) {
      expect(v).not.toMatch(regex);
    }
  });
});


test('Each of kinesis nested templates should set metrics widgets', () => {
  expect(kinesisStack.kinesisNestedStacks).toBeDefined();
  if (kinesisStack.kinesisNestedStacks) {
    [
      kinesisStack.kinesisNestedStacks.onDemandStack,
      kinesisStack.kinesisNestedStacks.provisionedStack,
    ]
      .map((s) => Template.fromStack(s))
      .forEach((t) => {
        t.hasResourceProperties('AWS::CloudFormation::CustomResource', {
          metricsWidgetsProps: {
            order: WIDGETS_ORDER.kinesisDataStream,
            projectId: Match.anyValue(),
            name: Match.anyValue(),
            description: {
              markdown: Match.anyValue(),
            },
            widgets: Match.anyValue(),
          },
        });
      });
  }
});

test('Check there are Kinesis Arn outputs in Kinesis', () => {
  const template = kinesisTemplate.toJSON();

  const kinesisArnOutput = template.Outputs && Object.keys(template.Outputs).find(key => key.indexOf('KinesisArn') !== -1);

  expect(kinesisArnOutput).toBeDefined();

});

test('Check there is no Kinesis outputs in S3 template', () => {
  const template = s3Template.toJSON();

  const kinesisArnOutput = template.Outputs && Object.keys(template.Outputs).find(key => key.indexOf('KinesisArn') !== -1);

  expect(kinesisArnOutput).toBeUndefined();
});

test('Should has Parameter AppRegistryApplicationArn', () => {
  s3Template.hasParameter('AppRegistryApplicationArn', {
    Type: 'String',
  });
});

test('Should has ApplicationArnCondition', () => {
  s3Template.hasCondition('ApplicationArnCondition', {
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
  s3Template.hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
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
