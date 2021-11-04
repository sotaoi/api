import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { payloadOptions } from '@sotaoi/api/routes/generic/payload-options';
import { ErrorResult } from '@sotaoi/omni/transactions';
import { logger } from '@sotaoi/api/logger';
import { Store } from '@sotaoi/api/store';
import { ErrorCode } from '@sotaoi/omni/errors';

let verifyToken = async (oauthAccessToken: null | string, scope: string): Promise<boolean> => {
  return false;
};

const setVerifyToken = (verifyTokenFn: (oauthAccessToken: null | string, scope: string) => Promise<boolean>): void => {
  verifyToken = verifyTokenFn;
};

const oauthScopedRoute: ServerRoute = {
  method: 'POST',
  path: '/n-api/oauth-scoped-route/{scope}',
  options: {
    payload: payloadOptions,
  },
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      const errorCode = 400;
      const error = new ErrorResult(errorCode, ErrorCode.APP_GENERIC_ERROR, 'Bad Request', 'Bad request', null, {});

      if (typeof request.params.scope !== 'string') {
        return handler.response(error).code(errorCode);
      }

      const payload = (
        typeof request.payload === 'object' && request.headers['content-length'] !== '0' ? request.payload : {}
      ) as { [key: string]: any };

      const scopedRequests = Store.getScopedRequests();
      if (!scopedRequests || !scopedRequests[request.params.scope]) {
        return handler.response(error).code(errorCode);
      }

      const authorizationHeader = request.headers.authorization || null;
      if (!(await verifyToken(authorizationHeader, request.params.scope))) {
        const errorCode = 401;
        const error = new ErrorResult(
          errorCode,
          ErrorCode.APP_GENERIC_ERROR,
          'Unauthorized',
          'You are unauthorized to make this request',
          null,
          {},
        );
        return handler.response(error).code(errorCode);
      }

      const result = await scopedRequests[request.params.scope](payload);

      return handler.response(result).code(200);
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

export { oauthScopedRoute, setVerifyToken };
