import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';

import middleware from '../lib/middleware';
import { getAuctionById } from './getAuction';
import schema from '../lib/schema/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  let updatedAuction = {};
  const { id } = event.pathParameters;
  const { amount } = event.body;

  const params = {
    TableName: process.env.AUCTIONS_TABLE,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount',
    ExpressionAttributeValues: {
      ':amount': amount,
    },
    ReturnValues: 'ALL_NEW',
  };

  const auction = await getAuctionById(id);

  if(amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Amount must be greater than ${auction.highestBid.amount}`);
  }

  if(auction.status !== 'OPEN') {
    throw new createError.Forbidden(`You can not place bid on closed auctions. Auction with ID ${auction.id} has already closed.`);
  }

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch(err) {
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      errors: null,
      data: updatedAuction,
    }),
  };
}

export const handler = middleware(placeBid)
  .use(validator({
    inputSchema: schema,
  }));
