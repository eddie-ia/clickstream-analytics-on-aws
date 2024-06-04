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

import { CloudFormationClient, DescribeStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';
import { CloudWatchEventsClient, DeleteRuleCommand, ListTargetsByRuleCommand, RemoveTargetsCommand } from '@aws-sdk/client-cloudwatch-events';
import { ConditionalCheckFailedException, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { ExecutionStatus } from '@aws-sdk/client-sfn';
import { DeleteTopicCommand, ListSubscriptionsByTopicCommand, SNSClient, UnsubscribeCommand } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { WorkflowStateType } from '../../../src/control-plane/backend/lambda/api/common/types';
import { getStackPrefix } from '../../../src/control-plane/backend/lambda/api/common/utils';
import { StepFunctionsExecutionStatusChangeNotificationEventDetail } from '../../../src/control-plane/backend/lambda/listen-stack-status/listen-tools';
import { handler } from '../../../src/control-plane/backend/lambda/listen-state-status';
import 'aws-sdk-client-mock-jest';

const docMock = mockClient(DynamoDBDocumentClient);
const cloudWatchEventsMock = mockClient(CloudWatchEventsClient);
const snsMock = mockClient(SNSClient);
const cloudFormationMock = mockClient(CloudFormationClient);

describe('Listen SFN Status Lambda Function', () => {

  const MOCK_PIPELINE_ID = '6972c135cb864885b25c5b7ebe584fdf';
  const MOCK_PROJECT_ID = '6666-6666';
  const MOCK_EXECUTION_ID = `main-${MOCK_PIPELINE_ID}-123`;

  const mockExecutionDetail = {
    executionArn: `arn:aws:states:ap-southeast-1:555555555555:execution:Clickstream-DataModelingRedshift-${MOCK_PIPELINE_ID}:${MOCK_EXECUTION_ID}`,
    name: MOCK_EXECUTION_ID,
    status: ExecutionStatus.SUCCEEDED,
  };

  const baseEvent: EventBridgeEvent<'Step Functions Execution Status Change', StepFunctionsExecutionStatusChangeNotificationEventDetail> = {
    'id': 'b1b9f9b0-1f1e-4f1f-8f1f-1f1f1f1f1f1f',
    'version': '0',
    'account': '0',
    'time': '2021-09-01T00:00:00Z',
    'region': 'ap-southeast-1',
    'detail-type': 'Step Functions Execution Status Change',
    'detail': mockExecutionDetail,
    'resources': [],
    'source': 'aws.states',
  };

  const mockPipeline = {
    id: MOCK_PIPELINE_ID,
    projectId: MOCK_PROJECT_ID,
    region: 'ap-southeast-1',
    updateAt: new Date('2022-01-01').getTime(),
  };

  beforeEach(() => {
    docMock.reset();
    cloudWatchEventsMock.reset();
    snsMock.reset();
  });

  test('Save state status to DDB', async () => {
    docMock.on(QueryCommand).resolves({
      Items: [{ ...mockPipeline, lastAction: 'Create' }],
    });
    docMock.on(UpdateCommand).resolves({});
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2023-01-01'));
    await handler(baseEvent);
    expect(docMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(docMock).toHaveReceivedNthSpecificCommandWith(1, UpdateCommand, {
      TableName: process.env.CLICKSTREAM_TABLE_NAME ?? '',
      Key: {
        id: MOCK_PROJECT_ID,
        type: `PIPELINE#${MOCK_PIPELINE_ID}#latest`,
      },
      ConditionExpression: '#ConditionVersion = :ConditionVersionValue',
      UpdateExpression: 'SET #executionDetail = :executionDetail, #ConditionVersion = :updateAt',
      ExpressionAttributeNames: {
        '#ConditionVersion': 'updateAt',
        '#executionDetail': 'executionDetail',
      },
      ExpressionAttributeValues: {
        ':executionDetail': mockExecutionDetail,
        ':ConditionVersionValue': new Date('2022-01-01').getTime(),
        ':updateAt': new Date('2023-01-01').getTime(),
      },
    });
    expect(docMock).toHaveReceivedCommandTimes(ScanCommand, 0);
    expect(docMock).toHaveReceivedCommandTimes(TransactWriteItemsCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(ListTargetsByRuleCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(RemoveTargetsCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(DeleteRuleCommand, 0);
  });

  test('Save state status to DDB with Conditional Check Failed', async () => {
    docMock.on(QueryCommand).resolves({
      Items: [{ ...mockPipeline, lastAction: 'Create' }],
    });
    const mockConditionalCheckFailed = new ConditionalCheckFailedException(
      {
        message: 'ConditionalCheckFailedException',
        $metadata: {},
      },
    );
    docMock.on(UpdateCommand).rejectsOnce(mockConditionalCheckFailed).resolves({});
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2023-01-01'));
    await handler(baseEvent);
    expect(docMock).toHaveReceivedCommandTimes(QueryCommand, 2);
    expect(docMock).toHaveReceivedNthSpecificCommandWith(2, UpdateCommand, {
      TableName: process.env.CLICKSTREAM_TABLE_NAME ?? '',
      Key: {
        id: MOCK_PROJECT_ID,
        type: `PIPELINE#${MOCK_PIPELINE_ID}#latest`,
      },
      ConditionExpression: '#ConditionVersion = :ConditionVersionValue',
      UpdateExpression: 'SET #executionDetail = :executionDetail, #ConditionVersion = :updateAt',
      ExpressionAttributeNames: {
        '#ConditionVersion': 'updateAt',
        '#executionDetail': 'executionDetail',
      },
      ExpressionAttributeValues: {
        ':executionDetail': mockExecutionDetail,
        ':ConditionVersionValue': new Date('2022-01-01').getTime(),
        ':updateAt': new Date('2023-01-01').getTime(),
      },
    });
    expect(docMock).toHaveReceivedCommandTimes(ScanCommand, 0);
    expect(docMock).toHaveReceivedCommandTimes(TransactWriteItemsCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(ListTargetsByRuleCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(RemoveTargetsCommand, 0);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(DeleteRuleCommand, 0);
  });

  test('Fetch all stack status when state machine is not running', async () => {
    docMock.on(QueryCommand).resolves({
      Items: [{
        ...mockPipeline,
        lastAction: 'Delete',
        workflow: {
          Version: '2022-03-15',
          Workflow: {
            Type: WorkflowStateType.PARALLEL,
            End: true,
            Branches: [
              {
                States: {
                  DataProcessing: {
                    Type: WorkflowStateType.STACK,
                    Data: {
                      Input: {
                        Region: 'ap-southeast-1',
                        TemplateURL: 'https://EXAMPLE-BUCKET.s3.us-east-1.amazonaws.com/clickstream-branch-main/feature-rel/main/default/data-pipeline-stack.template.json',
                        Action: 'Create',
                        Parameters: [],
                        StackName: `${getStackPrefix()}-DataProcessing-${MOCK_PIPELINE_ID}`,
                      },
                    },
                    Next: 'DataModeling',
                  },
                  Reporting: {
                    Type: WorkflowStateType.STACK,
                    Data: {
                      Input: {
                        Region: 'ap-southeast-1',
                        TemplateURL: 'https://EXAMPLE-BUCKET.s3.us-east-1.amazonaws.com/clickstream-branch-main/feature-rel/main/default/data-reporting-quicksight-stack.template.json',
                        Action: 'Create',
                        Parameters: [],
                        StackName: `${getStackPrefix()}-Reporting-${MOCK_PIPELINE_ID}`,
                      },
                    },
                    End: true,
                  },
                  DataModeling: {
                    Type: WorkflowStateType.STACK,
                    Data: {
                      Input: {
                        Region: 'ap-southeast-1',
                        TemplateURL: 'https://EXAMPLE-BUCKET.s3.us-east-1.amazonaws.com/clickstream-branch-main/feature-rel/main/default/data-analytics-redshift-stack.template.json',
                        Action: 'Create',
                        Parameters: [
                          {
                            ParameterKey: 'DataProcessingCronOrRateExpression',
                            ParameterValue: 'rate(16 minutes)',
                          },
                        ],
                        StackName: `${getStackPrefix()}-DataModelingRedshift-${MOCK_PIPELINE_ID}`,
                      },
                    },
                    Next: 'Reporting',
                  },
                },
                StartAt: 'DataProcessing',
              },
            ],
          },
        },
      }],
    });
    docMock.on(UpdateCommand).resolves({});
    cloudFormationMock.on(DescribeStacksCommand).resolves({
      Stacks: [
        {
          StackId: 'arn:aws:cloudformation:ap-southeast-1:123456789012:stack/Clickstream-DataModelingRedshift-6972c135cb864885b25c5b7ebe584fdf/123',
          StackName: `${getStackPrefix()}-DataModelingRedshift-${MOCK_PIPELINE_ID}`,
          StackStatus: StackStatus.CREATE_COMPLETE,
          StackStatusReason: 'Stack create completed',
          Tags: [
            {
              Key: 'Version',
              Value: '1.0.0',
            },
          ],
          Outputs: [
            {
              OutputKey: 'Output',
              OutputValue: 'OutputValue',
            },
          ],
          CreationTime: new Date('2023-01-01'),
        },
      ],
    });
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2023-01-01'));

    const failedEvent: EventBridgeEvent<'Step Functions Execution Status Change', StepFunctionsExecutionStatusChangeNotificationEventDetail> = {
      ...baseEvent,
      detail: {
        ...mockExecutionDetail,
        status: ExecutionStatus.FAILED,
      },
    };

    await handler(failedEvent);
    expect(docMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(docMock).toHaveReceivedNthSpecificCommandWith(1, UpdateCommand, {
      TableName: process.env.CLICKSTREAM_TABLE_NAME ?? '',
      Key: {
        id: MOCK_PROJECT_ID,
        type: `PIPELINE#${MOCK_PIPELINE_ID}#latest`,
      },
      ConditionExpression: '#ConditionVersion = :ConditionVersionValue',
      UpdateExpression: 'SET #executionDetail = :executionDetail, #ConditionVersion = :updateAt',
      ExpressionAttributeNames: {
        '#ConditionVersion': 'updateAt',
        '#executionDetail': 'executionDetail',
      },
      ExpressionAttributeValues: {
        ':executionDetail': {
          ...mockExecutionDetail,
          status: ExecutionStatus.FAILED,
        },
        ':ConditionVersionValue': new Date('2022-01-01').getTime(),
        ':updateAt': new Date('2023-01-01').getTime(),
      },
    });
    expect(docMock).toHaveReceivedCommandTimes(UpdateCommand, 2);
    expect(cloudFormationMock).toHaveReceivedCommandTimes(DescribeStacksCommand, 3);
  });

  test('Delete project', async () => {
    docMock.on(QueryCommand).resolves({
      Items: [{ ...mockPipeline, lastAction: 'Delete' }],
    });
    docMock.on(UpdateCommand).resolves({});
    docMock.on(ScanCommand).resolves({
      Items: [
        {
          id: MOCK_PROJECT_ID,
          type: `PIPELINE#${MOCK_PIPELINE_ID}#latest`,
          executionDetail: mockExecutionDetail,
        },
      ],
    });
    docMock.on(TransactWriteItemsCommand).resolves({});
    cloudWatchEventsMock.on(ListTargetsByRuleCommand).resolves({
      Targets: [
        {
          Arn: 'arn:aws:lambda:ap-southeast-1:123456789012:function:Clickstream-DataModelingRedshift-DeleteProject',
          Id: 'Clickstream-DataModelingRedshift-DeleteProject',
        },
      ],
    });
    cloudWatchEventsMock.on(RemoveTargetsCommand).resolves({});
    cloudWatchEventsMock.on(DeleteRuleCommand).resolves({});
    snsMock.on(ListSubscriptionsByTopicCommand).resolves({
      Subscriptions: [
        {
          SubscriptionArn: 'arn:aws:sns:ap-southeast-1:123456789012:s1',
        },
        {
          SubscriptionArn: 'arn:aws:sns:ap-southeast-1:123456789012:s2',
        },
      ],
    });
    snsMock.on(UnsubscribeCommand).resolves({});
    snsMock.on(DeleteTopicCommand).resolves({});
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2023-01-01'));
    await handler(baseEvent);
    expect(docMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(docMock).toHaveReceivedNthSpecificCommandWith(1, UpdateCommand, {
      TableName: process.env.CLICKSTREAM_TABLE_NAME ?? '',
      Key: {
        id: MOCK_PROJECT_ID,
        type: `PIPELINE#${MOCK_PIPELINE_ID}#latest`,
      },
      ConditionExpression: '#ConditionVersion = :ConditionVersionValue',
      UpdateExpression: 'SET #executionDetail = :executionDetail, #ConditionVersion = :updateAt',
      ExpressionAttributeNames: {
        '#ConditionVersion': 'updateAt',
        '#executionDetail': 'executionDetail',
      },
      ExpressionAttributeValues: {
        ':executionDetail': mockExecutionDetail,
        ':ConditionVersionValue': new Date('2022-01-01').getTime(),
        ':updateAt': new Date('2023-01-01').getTime(),
      },
    });
    expect(docMock).toHaveReceivedCommandTimes(ScanCommand, 1);
    expect(docMock).toHaveReceivedCommandTimes(TransactWriteItemsCommand, 1);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(ListTargetsByRuleCommand, 1);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(RemoveTargetsCommand, 1);
    expect(cloudWatchEventsMock).toHaveReceivedCommandTimes(DeleteRuleCommand, 1);
    expect(snsMock).toHaveReceivedCommandTimes(ListSubscriptionsByTopicCommand, 1);
    expect(snsMock).toHaveReceivedCommandTimes(UnsubscribeCommand, 2);
    expect(snsMock).toHaveReceivedCommandTimes(DeleteTopicCommand, 1);
  });

});
