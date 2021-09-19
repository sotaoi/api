import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { payloadOptions } from '@sotaoi/api/routes/generic/payload-options';
import { ErrorResult } from '@sotaoi/omni/transactions';
import { logger } from '@sotaoi/api/logger';
import { AuthHandler } from '@sotaoi/api/commands/auth-handler';
import { ErrorCode } from '@sotaoi/omni/errors';

const deauthRoute: ServerRoute = {
  method: 'DELETE',
  path: '/api/auth',
  options: {
    payload: payloadOptions,
  },
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      await AuthHandler.deauth(handler);
      return handler.response({ ok: true });
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

export { deauthRoute };
