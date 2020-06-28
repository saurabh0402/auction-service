import jwt from 'jsonwebtoken';

const generatePolicy = (principalId, methodArn) => {
  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*';
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: apiGatewayWildcard
        }
      ]
    }
  };
};

export const handler = async (event, context) => {
  if(!event.authorizationToken) {
    throw 'Unauthorized';
  }

  const token = event.authorizationToken.replace('Bearer ', '');

  try {
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY);
    const policy = generatePolicy(claims.sub, event.methodArn);

    return {
      ...policy,
      context: claims,
    };
  } catch(err) {
    console.error(err);
    throw 'Unauthorized';
  }
};