import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { payloadOptions } from '@sotaoi/api/routes/generic/payload-options';
import { ErrorResult, MsgResult } from '@sotaoi/omni/transactions';
import { Output } from '@sotaoi/api/output';
import { logger } from '@sotaoi/api/logger';
import { ErrorCode } from '@sotaoi/omni/errors';

const updateRoute: ServerRoute = {
  method: 'POST',
  path: '/n-api/update',
  options: {
    payload: payloadOptions,
  },
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      const result = await Output.runCommand('update', request, handler, logger);
      return result;
    } catch (err) {
      logger().estack(err);
      const code = 400;
      return handler
        .response(
          new ErrorResult(
            code,
            ErrorCode.APP_GENERIC_ERROR,
            err.name || 'Error',
            err.message || 'Something went wrong',
            null,
            {},
          ),
        )
        .code(code);
    }
  },
};

export { updateRoute };
