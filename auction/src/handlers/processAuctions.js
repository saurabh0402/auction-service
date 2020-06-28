const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getUpdateParams = (auction) => {
  const params = {
    TableName: process.env.AUCTIONS_TABLE,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  return params;
};

const processAuctions = async (event, context) => {
  try {
    let expiredAuctions = [];
    const now = new Date();

    const params = {
      TableName: process.env.AUCTIONS_TABLE,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status AND endingAt <= :endingAt',
      ExpressionAttributeValues: {
        ':status': 'OPEN',
        ':endingAt': now.toISOString(),
      },
      ExpressionAttributeNames: {
        '#status': 'status',
      }
    };

    const result = await dynamodb.query(params).promise();
    expiredAuctions = result.Items;

    const closeAuctionPromises = expiredAuctions.map(auction => {
      return dynamodb.update(getUpdateParams(auction)).promise();
    });

    await Promise.all(closeAuctionPromises);
    console.log("Done!");

    return {
      success: true,
      errors: null,
    };
  } catch(err) {
    console.error(err);
    return {
      success: false,
      errors: err,
    };
  }
};

export const handler = processAuctions;