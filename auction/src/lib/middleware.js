import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventHandler from '@middy/http-error-handler';
import httpErrorHandler from '@middy/http-error-handler';

const middleware = handler => middy(handler)
  .use([
    httpJsonBodyParser(),
    httpEventHandler(),
    httpErrorHandler(),
  ]);

export default middleware;