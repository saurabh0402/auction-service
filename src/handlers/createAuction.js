import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import middleware from '../lib/middleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = event.body;
  const createdAt = new Date();
  let endingAt = new Date();
  endingAt.setHours(endingAt.getHours() + 1);

  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: createdAt.toISOString(),
    endingAt: endingAt.toISOString(),
    highestBid: {
      amount: 0,
    }
  };

  try {
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE,
      Item: auction,
    }).promise();
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

export const handler = middleware(createAuction);
