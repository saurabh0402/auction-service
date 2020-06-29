import AWS from 'aws-sdk';

const ses = new AWS.SES({
  region: process.env.REGION,
});

async function sendMail(event, context) {
  const [record] = event.Records;
  console.log("Record ", record);

  const {
    subject, body, recipient
  } = JSON.parse(record.body);

  const params = {
    Source: 'cs14mi539@nith.ac.in',
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        }
      },
      Subject: {
        Data: subject
      }
    }
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(result);
  } catch(err) {
    console.error(err);
  }
};

export const handler = sendMail;