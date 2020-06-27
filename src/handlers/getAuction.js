import AWS from 'aws-sdk';
import middleware from '../lib/middleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const getAuctionById = async (id) => {
  let auction;

  try {
    const result = await dynamodb.get({
      TableName: process.env.AUCTIONS_TABLE,
      Key: { id }
    }).promise();

    auction = result.Item;
  } catch(err) {
    throw new createError.InternalServerError(err);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ${id} does not exist`);
  }

  return auction;
};

async function getAuction(event, context) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

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
