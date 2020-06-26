import AWS from 'aws-sdk';
import middleware from '../lib/middleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  let auctions = [];
  try {
    const result = await dynamodb.scan({
      TableName: process.env.AUCTIONS_TABLE,
    }).promise();

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

export const handler = middleware(getAuctions);


