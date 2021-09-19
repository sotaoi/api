import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { storage } from '@sotaoi/api/storage';
import { logger } from '@sotaoi/api/logger';
import { ErrorCode } from '@sotaoi/omni/errors';

const storageRoute: ServerRoute = {
  method: 'GET',
  path: '/api/storage/{drive}/{role}/{dap*}',
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      const dapSplit = request.params.dap.split('/');
      const domain = dapSplit.shift();
      const pathname = dapSplit.join('/');
      if (!domain || !pathname) {
        throw new Error('something went wrong');
      }
      const result = await storage(request.params.drive).read(handler, request.params.role, {
        domain,
        pathname,
      });
      return result;
    } catch (err) {
      logger().estack(err);
      const code = 404;
      return handler
        .response({
          code: code,
          errorCode: ErrorCode.APP_GENERIC_ERROR,
          error: 'Not Found',
          message: 'Not Found',
        })
        .code(code);
    }
  },
};

export { storageRoute };
