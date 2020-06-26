import AWS from 'aws-sdk';
import middleware from '../lib/middleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuction(event, context) {
  let auction = {};
  const { id } = event.pathParameters;

  try {
    const result = await dynamodb.get({
      TableName: process.env.AUCTIONS_TABLE,
      Key: { id }
    }).promise();

    auction = result.Item;
  } catch(err) {
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      errors: null,
      data: auction,
    }),
  };
}

export const handler = middleware(getAuction);
