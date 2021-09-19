import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { ErrorResult } from '@sotaoi/omni/transactions';
import { ErrorCode } from '@sotaoi/omni/errors';

const notFoundRoute: ServerRoute = {
  method: ['POST', 'PUT', 'PATCH', 'DELETE'],
  path: '/{any*}',
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    const code = 404;
    return handler
      .response(
        new ErrorResult(
          code,
          ErrorCode.APP_GENERIC_ERROR,
          'Not found',
          'We did not find what you were looking for',
          null,
          {},
        ),
      )
      .code(code);
  },
};

export { notFoundRoute };
