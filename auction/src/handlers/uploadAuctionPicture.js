import createError from 'http-errors';
import AWS from 'aws-sdk';
import validator from '@middy/validator';

import middleware from '../lib/middleware';
import { getAuctionById } from './getAuction';
import uploadImage from '../lib/uploadImage';
import schema from '../lib/schema/uploadAuctionPicture';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const upload = async (event, context) => {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const body = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(body, 'base64');

  const auction = await getAuctionById(id);
  let updatedAuction;

  if(email !== auction.seller) {
    throw createError.Unauthorized("You can not upload the image for a bid as you are not the seller");
  }

  try {
    const imageUrl = await uploadImage(auction.id + '.jpg', buffer);
    const params = {
      TableName: process.env.AUCTIONS_TABLE,
      Key: { id },
      UpdateExpression: 'set imageUrl = :imageUrl',
      ExpressionAttributeValues: {
        ':imageUrl': imageUrl,
      },
      ReturnValues: 'ALL_NEW',
    };

    const updatedData = await dynamoDb.update(params).promise();
    updatedAuction = updatedData.Attributes;
  } catch(err) {
    console.error(err);
    throw new createError.InternalServerError("Failed to upload image");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      error: null,
      data: updatedAuction,
    }),
  };
};

export const handler = middleware(upload)
  .use(validator({
    inputSchema: schema,
  }));