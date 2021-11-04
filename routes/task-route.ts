import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { payloadOptions } from '@sotaoi/api/routes/generic/payload-options';
import { ErrorResult } from '@sotaoi/omni/transactions';
import { Output } from '@sotaoi/api/output';
import { logger } from '@sotaoi/api/logger';
import { ErrorCode } from '@sotaoi/omni/errors';

const taskRoute: ServerRoute = {
  method: 'POST',
  path: '/n-api/task',
  options: {
    payload: payloadOptions,
  },
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      return await Output.runCommand('task', request, handler, logger);
    } catch (err) {
      logger().estack(err);
      const code = 400;
      return handler
        .response(
          new ErrorResult(code, ErrorCode.APP_GENERIC_ERROR, err.name || 'Error', 'Something went wrong', null, {}),
        )
        .code(code);
    }
  },
};

export { taskRoute };
