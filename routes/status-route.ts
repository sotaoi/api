import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { ErrorResult, MsgResult } from '@sotaoi/omni/transactions';
import { logger } from '@sotaoi/api/logger';
import { ErrorCode } from '@sotaoi/omni/errors';
import { Store } from '@sotaoi/api/store';

const statusRoute: ServerRoute = {
  method: 'GET',
  path: '/api/status',
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      return new MsgResult<ResponseObject>(200, null, 'API Status', 'Served API Status', {
        maintenance: !!(await Store.ensureAppPocket())?.coreState?.appMaintenance,
      }).output(handler);
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

export { statusRoute };
