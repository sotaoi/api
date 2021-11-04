import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { Seed } from '@sotaoi/omni/state';
import { ErrorResult } from '@sotaoi/omni/transactions';
import { AuthHandler } from '@sotaoi/api/commands/auth-handler';
import { lang } from '@sotaoi/api/lang';
import { logger } from '@sotaoi/api/logger';
import { AuthRecord } from '@sotaoi/omni/artifacts';
import { ErrorCode } from '@sotaoi/omni/errors';
import { Store } from '@sotaoi/api/store';

const seedRoute: ServerRoute = {
  method: 'GET',
  path: '/n-api/seed',
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    try {
      let authRecord: null | AuthRecord = null;
      let accessToken: null | string = null;

      if (Store.getCachedMaintenanceFlag()) {
        return handler
          .response({
            'app.meta.title': '',
            'app.credentials.authRecord': null,
            'app.coreState.maintenance': true,
            'app.credentials.accessToken': null,
            'app.lang.selected': '',
            'app.lang.default': '',
            'app.lang.available': [''],
            'app.lang.translations': {},
          })
          .code(200);
      }

      try {
        [authRecord, accessToken] = await AuthHandler.translateAccessToken(
          handler,
          AuthHandler.getAccessToken(handler),
        );
      } catch (err) {
        logger().wstack(err);
      }
      const code = 200;
      const seed: Seed = {
        'app.meta.title': '',
        'app.credentials.authRecord': authRecord,
        'app.coreState.maintenance': Store.getCachedMaintenanceFlag(),
        'app.credentials.accessToken': accessToken,
        ...(await lang().getLangData()),
      };
      return handler.response(seed).code(code);
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

export { seedRoute };
