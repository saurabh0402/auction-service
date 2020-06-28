import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';

import middleware from '../lib/middleware';
import schema from '../lib/schema/getAuctionsSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;
  let auctions = [];

  if(!status) {
    throw new createError.BadRequest(`Status not provided!`);
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  try {
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch(err) {
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      errors: null,
      data: auctions,
    }),
  };
}

export const handler = middleware(getAuctions)
  .use(validator({
    inputSchema: schema,
    useDefaults: true,
  }));
