const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

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

const sendMail = (auction) => {
  const { title, seller, highestBid: { amount, bidder } } = auction;

  if(!amount) {
    return [
      sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: 'Your Auction has completed',
          recipient: seller,
          body: `Sorry, Your Auction - ${title}, has no bids. But don't fret about it, you can anytime create a new auction!`,
        }),
      }).promise()
    ];
  }

  const sellerMail = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'Your Auction has completed',
      recipient: seller,
      body: `Congrats, Your Auction - ${title}, has completed and is sold to ${bidder} for ${amount} rupees.`,
    }),
  }).promise();

  const bidderMail = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'Your Bid is successful',
      recipient: bidder,
      body: `Congrats, Your Bid for Auction - ${title}, is successful and you have won it for ${amount} rupees.`,
    }),
  }).promise();

  return [sellerMail, bidderMail];
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

    let emailPromises = [];
    const closeAuctionPromises = expiredAuctions.map(auction => {
      emailPromises = [...emailPromises, ...sendMail(auction)];
      return dynamodb.update(getUpdateParams(auction)).promise();
    });

    await Promise.all(closeAuctionPromises);
    await Promise.all(emailPromises);
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