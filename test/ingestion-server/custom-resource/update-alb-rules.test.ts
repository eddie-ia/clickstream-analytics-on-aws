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

// @ts-nocheck
import { ElasticLoadBalancingV2Client, CreateRuleCommand, ModifyListenerCommand, DeleteRuleCommand, DescribeRulesCommand, ModifyRuleCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { handler } from '../../../src/ingestion-server/custom-resource/update-alb-rules/index';
import { getMockContext } from '../../common/lambda-context';

const c = getMockContext();

//@ts-ignore
const albClientMock = mockClient(ElasticLoadBalancingV2Client);
const secretsManagerClientMock = mockClient(SecretsManagerClient);

beforeEach(() => {
  albClientMock.reset();
  secretsManagerClientMock.reset();
});

const basicEvent = {
  ServiceToken: 'arn:aws:lambda:us-east-1:11111111111:function:testFn',
  ResponseURL: 'https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/testUrl',
  StackId: 'arn:aws:cloudformation:us-east-1:111111111111:stack/test/54bce910-a6c8-11ed-8ff3-1212426f2299',
  RequestId: '6ffb9981-d1af-4177-aac1-34e11cdcccd8',
  LogicalResourceId: 'create-test-custom-resource',
  ResourceType: 'AWS::CloudFormation::CustomResource',
  ResourceProperties: {
    ServiceToken: 'arn:aws:lambda:us-east-1:11111111111:function:testFn',
    endpointPath: '/collect',
    listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
    domainName: 'example.com',
  },
};

const secretReturnData = {
  SecretString: JSON.stringify({
    issuer: 'issuer',
    userEndpoint: 'userEndpoint',
    authorizationEndpoint: 'authorizationEndpoint',
    tokenEndpoint: 'tokenEndpoint',
    appClientId: 'appClientId',
    appClientSecret: 'appClientSecret',
  }),
};

test('Create listener rules for third party SDK with auth', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Create',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'No',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      protocol: 'HTTPS',
    },
  };

  secretsManagerClientMock.on(GetSecretValueCommand).resolves({
    SecretString: JSON.stringify({
      issuer: 'issuer',
      userEndpoint: 'userEndpoint',
      authorizationEndpoint: 'authorizationEndpoint',
      tokenEndpoint: 'tokenEndpoint',
      appClientId: 'appClientId',
      appClientSecret: 'appClientSecret',
    }),
  });

  await handler(event, c);

  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(1, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 2,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(2, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/ping'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 3,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(3, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'authenticate',
        },
      },
      {
        Type: 'fixed-response',
        Order: 2,
        FixedResponseConfig: {
          MessageBody: 'Authenticated',
          StatusCode: '200',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/login'],
      },
      {
        Field: 'http-request-method',
        HttpRequestMethodConfig: {
          Values: ['GET'],
        },
      },
    ],
    Priority: 4,
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
});

test('Create listener rules for ClickStream SDK with auth, AppIds size is 0', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Create',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      protocol: 'HTTPS',
    },
  };

  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        Priority: '2',
      },
    ],
  });

  await handler(event, c);

  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(1, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 2,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(3, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'authenticate',
        },
      },
      {
        Type: 'fixed-response',
        Order: 2,
        FixedResponseConfig: {
          MessageBody: 'Authenticated',
          StatusCode: '200',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/login'],
      },
      {
        Field: 'http-request-method',
        HttpRequestMethodConfig: {
          Values: ['GET'],
        },
      },
    ],
    Priority: 4,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(5, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'fixed-response',
        FixedResponseConfig: {
          MessageBody: 'Configuration invalid!',
          StatusCode: '400',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        PathPatternConfig: {
          Values: ['/*'],
        },
      },
    ],
    Priority: 1,
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(6, ModifyListenerCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',

    DefaultActions: [
      {
        Type: 'fixed-response',
        FixedResponseConfig: {
          MessageBody: 'DefaultAction: Invalid request',
          StatusCode: '403',
          ContentType: 'text/plain',
        },
      },
    ],
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
});

test('Create listener rules for ClickStream SDK with auth, AppIds size is NOT 0', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Create',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: 'notepad1,notepad2',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      protocol: 'HTTPS',
    },
  };
  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        Priority: '2',
        RuleArn: 'ruleArn2',
      },
      {
        Priority: '1',
        RuleArn: 'ruleArn1',
      },
    ],
  });

  await handler(event, c);

  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(1, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 2,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(3, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'authenticate',
        },
      },
      {
        Type: 'fixed-response',
        Order: 2,
        FixedResponseConfig: {
          MessageBody: 'Authenticated',
          StatusCode: '200',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/login'],
      },
      {
        Field: 'http-request-method',
        HttpRequestMethodConfig: {
          Values: ['GET'],
        },
      },
    ],
    Priority: 4,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(5, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'notepad1',
            },
          ],
        },
      },
    ],
    Priority: 5,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(6, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/ping'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'notepad1',
            },
          ],
        },
      },
    ],
    Priority: 6,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(7, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'notepad2',
            },
          ],
        },
      },
    ],
    Priority: 7,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(10, DeleteRuleCommand, {
    RuleArn: 'ruleArn1',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(11, DeleteRuleCommand, {
    RuleArn: 'ruleArn2',
  });
  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
});

test('Create listener rules for ClickStream SDK without auth', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Create',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: '',
      protocol: 'HTTPS',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        Priority: '2',
      },
    ],
  });

  await handler(event, c);

  expect(albClientMock).toHaveReceivedNthCommandWith(1, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Order: 2,
        Type: 'forward',
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 2,
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(4, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'fixed-response',
        FixedResponseConfig: {
          MessageBody: 'Configuration invalid!',
          StatusCode: '400',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        PathPatternConfig: {
          Values: ['/*'],
        },
      },
    ],
    Priority: 1,
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
});

test('Create listener rules for Third Party SDK without auth', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Create',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'No',
      authenticationSecretArn: '',
      protocol: 'HTTP',
    },
  };

  await handler(event, c);

  expect(albClientMock).toHaveReceivedNthCommandWith(1, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Order: 2,
        Type: 'forward',
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
    ],
    Priority: 2,
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
});

test('Update listener rules for third party SDK with auth, change domain, endpoint path and auth secret arn', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Update',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'No',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      protocol: 'HTTPS',
    },
    OldResourceProperties: {
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
      endpointPath: '/collectold',
      domainName: 'exampleold.com',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        Priority: '4',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        Priority: '5',
        RuleArn: 'ruleArn2',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/ping'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        Priority: '3',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/login'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
    ],
  });

  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  await handler(event, c);

  expect(albClientMock).toHaveReceivedCommandTimes(DescribeRulesCommand, 3);
  expect(albClientMock).toHaveReceivedNthCommandWith(2, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    RuleArn: 'ruleArn1',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(4, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/ping'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    RuleArn: 'ruleArn2',
  });
  expect(albClientMock).toHaveReceivedCommandTimes(ModifyRuleCommand, 5);
  expect(albClientMock).toHaveReceivedCommandTimes(ModifyListenerCommand, 1);
  expect(albClientMock).toHaveReceivedCommandTimes(CreateRuleCommand, 0);
  expect(albClientMock).toHaveReceivedCommandTimes(DeleteRuleCommand, 0);
});

test('Update Listener for ClickStream SDK, with HTTPS and auth, add appIds, and no existing appId rules, change domain, endpoint path and auth secret arn ', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Update',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: 'app1,app2',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
      protocol: 'HTTPS',
    },
    OldResourceProperties: {
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      endpointPath: '/collectold',
      domainName: 'exampleold.com',
    },
  };

  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        Priority: '5',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        Priority: '4',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/login'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
    ],
  });

  await handler(event, c);

  expect(albClientMock).toHaveReceivedNthCommandWith(1, DescribeRulesCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
  });
  expect(albClientMock).toHaveReceivedCommandTimes(DescribeRulesCommand, 6);
  expect(albClientMock).toHaveReceivedNthCommandWith(2, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    RuleArn: 'ruleArn1',
  });
  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(8, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'app1',
            },
          ],
        },
      },
    ],
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Priority: 6,
  });
  expect(albClientMock).toHaveReceivedCommandTimes(CreateRuleCommand, 4);
  expect(albClientMock).toHaveReceivedCommandTimes(DeleteRuleCommand, 0);
});

test('Update Listener for ClickStream SDK, with HTTPS and auth, without appIds, and have existing appId rules, change domain, endpoint path and auth secret arn ', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Update',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: '',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
      protocol: 'HTTPS',
    },
    OldResourceProperties: {
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      endpointPath: '/collectold',
      domainName: 'exampleold.com',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        RuleArn: 'RuleArn4',
        Priority: '5',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad1',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        RuleArn: 'RuleArn5',
        Priority: '6',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad2',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        Priority: '4',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/login'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
    ],
  });

  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  await handler(event, c);

  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(1, DescribeRulesCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(2, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'nodePad1',
            },
          ],
        },
      },
    ],
    RuleArn: 'RuleArn4',
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyRuleCommand, 5);

  expect(albClientMock).toHaveReceivedNthCommandWith(11, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'fixed-response',
        FixedResponseConfig: {
          MessageBody: 'Configuration invalid!',
          StatusCode: '400',
          ContentType: 'text/plain',
        },
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        PathPatternConfig: {
          Values: ['/*'],
        },
      },
    ],
    Priority: 1,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(12, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Order: 2,
        Type: 'forward',
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 2,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(13, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Order: 2,
        Type: 'forward',
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/ping'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
    ],
    Priority: 3,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(14, DeleteRuleCommand, {
    RuleArn: 'RuleArn4',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(15, DeleteRuleCommand, {
    RuleArn: 'RuleArn5',
  });
});

test('Update Listener for ClickStream SDK, with HTTPS and auth, have existing appId rules, add appIds change domain, endpoint path and auth secret arn ', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Update',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: 'nodePad2,nodePad3',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
      protocol: 'HTTPS',
    },
    OldResourceProperties: {
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      endpointPath: '/collectold',
      domainName: 'exampleold.com',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        RuleArn: 'RuleArn4',
        Priority: '5',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad1',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        RuleArn: 'RuleArn5',
        Priority: '6',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad2',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
          {
            Field: 'host-header',
            Values: ['exampleold.com'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
      {
        Priority: '4',
        RuleArn: 'ruleArn1',
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/login'],
          },
        ],
        Actions: [
          {
            Type: 'authenticate-oidc',
          },
        ],
      },
    ],
  });

  secretsManagerClientMock.on(GetSecretValueCommand).resolves(secretReturnData);

  await handler(event, c);

  expect(secretsManagerClientMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
    SecretId: 'arn:aws:secretsmanager:us-east-1:11111111112:secret:test-secret',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(1, DescribeRulesCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
  });

  expect(albClientMock).toHaveReceivedCommandTimes(DescribeRulesCommand, 6);

  expect(albClientMock).toHaveReceivedNthCommandWith(2, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'nodePad1',
            },
          ],
        },
      },
    ],
    RuleArn: 'RuleArn4',
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyRuleCommand, 5);

  expect(albClientMock).toHaveReceivedNthCommandWith(10, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'authenticate-oidc',
        Order: 1,
        AuthenticateOidcConfig: {
          Issuer: 'issuer',
          ClientId: 'appClientId',
          ClientSecret: 'appClientSecret',
          TokenEndpoint: 'tokenEndpoint',
          UserInfoEndpoint: 'userEndpoint',
          AuthorizationEndpoint: 'authorizationEndpoint',
          OnUnauthenticatedRequest: 'deny',
        },
      },
      {
        Order: 2,
        Type: 'forward',
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'host-header',
        Values: ['example.com'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'nodePad3',
            },
          ],
        },
      },
    ],
    Priority: 7,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(14, DeleteRuleCommand, {
    RuleArn: 'RuleArn4',
  });
});

test('Update Listener for ClickStream SDK, with HTTP, have existing appId rules, add appIds change domain, endpoint path and auth secret arn', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Update',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: 'notepad1,notepad2,nodePad3',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: '',
      protocol: 'HTTP',
    },
    OldResourceProperties: {
      endpointPath: '/collectold',
      domainName: 'exampleold.com',
      authenticationSecretArn: '',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        RuleArn: 'RuleArn4',
        Priority: '5',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad3',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
        ],
      },
      {
        RuleArn: 'RuleArn5',
        Priority: '6',
        Conditions: [
          {
            Field: 'query-string',
            QueryStringConfig: {
              Values: [
                {
                  Key: 'appId', Value: 'nodePad4',
                },
              ],
            },
          },
          {
            Field: 'path-pattern',
            Values: ['/collectold'],
          },
        ],
      },
    ],
  });

  await handler(event, c);

  expect(albClientMock).toHaveReceivedNthCommandWith(1, DescribeRulesCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
  });

  expect(albClientMock).toHaveReceivedCommandTimes(DescribeRulesCommand, 5);

  expect(albClientMock).toHaveReceivedNthCommandWith(2, ModifyRuleCommand, {
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'nodePad3',
            },
          ],
        },
      },
    ],
    RuleArn: 'RuleArn4',
  });

  expect(albClientMock).toHaveReceivedCommandTimes(ModifyRuleCommand, 2);

  expect(albClientMock).toHaveReceivedNthCommandWith(6, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'notepad1',
            },
          ],
        },
      },
    ],
    Priority: 7,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(8, CreateRuleCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
    Actions: [
      {
        Type: 'forward',
        Order: 2,
        TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:targetgroup/abc/70fd51a0147e8b66',
      },
    ],
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/collect'],
      },
      {
        Field: 'query-string',
        QueryStringConfig: {
          Values: [
            {
              Key: 'appId', Value: 'notepad2',
            },
          ],
        },
      },
    ],
    Priority: 9,
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(12, DeleteRuleCommand, {
    RuleArn: 'RuleArn5',
  });
});

test('Delete all Listener rules for ClickStream SDK, with HTTPS and auth, with appIds, and with existing appId rules', async () => {
  const event: CloudFormationCustomResourceEvent = {
    ...basicEvent,
    RequestType: 'Delete',
    ResourceProperties: {
      ...basicEvent.ResourceProperties,
      appIds: 'nodePad1, nodePad2',
      clickStreamSDK: 'Yes',
      authenticationSecretArn: 'arn:aws:secretsmanager:us-east-1:11111111111:secret:test-secret',
      protocol: 'HTTPS',
    },
  };

  albClientMock.on(DescribeRulesCommand).resolves({
    Rules: [
      {
        RuleArn: 'forwardRuleArn1',
        IsDefault: true,
      },
      {
        RuleArn: 'forwardRuleArn2',
        IsDefault: false,
      },
      {
        RuleArn: 'forwardRuleArn3',
        IsDefault: false,
      },
      {
        RuleArn: 'forwardRuleArn4',
        IsDefault: false,
      },
    ],
  });

  await handler(event, c);

  expect(albClientMock).toHaveReceivedNthCommandWith(1, DescribeRulesCommand, {
    ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:11111111111:listener/app/abc/026af704b2ff1dcc',
  });

  expect(albClientMock).toHaveReceivedNthCommandWith(3, DeleteRuleCommand, {
    RuleArn: 'forwardRuleArn2',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(4, DeleteRuleCommand, {
    RuleArn: 'forwardRuleArn3',
  });
  expect(albClientMock).toHaveReceivedNthCommandWith(5, DeleteRuleCommand, {
    RuleArn: 'forwardRuleArn4',
  });
});