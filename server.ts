import Hapi, { ResponseObject } from '@hapi/hapi';
import { greetingRoute } from '@sotaoi/api/routes/greeting-route';
import { seedRoute } from '@sotaoi/api/routes/seed-route';
import { notFoundRoute } from '@sotaoi/api/routes/not-found-route';
import { storeRoute } from '@sotaoi/api/routes/store-route';
import { updateRoute } from '@sotaoi/api/routes/update-route';
import { queryRoute } from '@sotaoi/api/routes/query-route';
import { retrieveRoute } from '@sotaoi/api/routes/retrieve-route';
import { removeRoute } from '@sotaoi/api/routes/remove-route';
import { taskRoute } from '@sotaoi/api/routes/task-route';
import { authRoute } from '@sotaoi/api/routes/auth-route';
import { deauthRoute } from '@sotaoi/api/routes/deauth-route';
import { storageRoute } from '@sotaoi/api/routes/storage-route';
import { statusRoute } from '@sotaoi/api/routes/status-route';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import { Server as HttpsServer } from 'https';
import { Server as HttpServer } from 'http';
import { logger } from '@sotaoi/api/logger';
import { oauthScopedRoute } from '@sotaoi/api/routes/oauth-scoped-route';
import fs from 'fs';
import { Store } from '@sotaoi/api/store';
import { MsgResult } from '@sotaoi/omni/transactions';
import { Config } from '@sotaoi/config';

let appMaintenanceFlag = false;
let maintenanceInterval: any = null;

const HapiCors = require('hapi-cors');

class Server {
  public static async init(
    noServer: boolean,
    tls: { key: string; cert: string; ca: string; rejectUnauthorized: boolean },
  ): Promise<null | HttpServer | HttpsServer> {
    try {
      clearInterval(maintenanceInterval);

      if (noServer) {
        return null;
      }

      maintenanceInterval = setInterval(async () => {
        try {
          appMaintenanceFlag = !!(await Store.isAppInMaintenance());
        } catch (err) {
          appMaintenanceFlag = false;
          logger().error(err);
        }
      }, 1000);

      const appInfo = Config.getAppInfo();

      if (!appInfo) {
        throw new Error('Failed to get app info');
      }

      const server = Hapi.server({
        port: appInfo.apiPort,
        host: '0.0.0.0',
        tls: {
          key: fs.readFileSync(tls.key),
          cert: fs.readFileSync(tls.cert),
          ca: fs.readFileSync(tls.ca),
          rejectUnauthorized: tls.rejectUnauthorized,
        },
      });

      server.route(greetingRoute('/'));
      server.route(greetingRoute('/api'));
      server.route(statusRoute);
      server.route(seedRoute);

      server.route(storeRoute);
      server.route(updateRoute);
      server.route(queryRoute);
      server.route(retrieveRoute);
      server.route(removeRoute);
      server.route(taskRoute);

      server.route(authRoute);
      server.route(deauthRoute);
      server.route(oauthScopedRoute);

      server.route(storageRoute);

      server.route(notFoundRoute);

      await server.register([Inert, Vision, HapiCors]);

      await server.register({
        name: 'app-maintenance-plugin',
        register: async (server, options): Promise<void> => {
          server.ext({
            type: 'onRequest',
            method: async (request, reply) => {
              if (
                !appMaintenanceFlag ||
                request.url.pathname === '/api/seed' ||
                request.url.pathname === '/api/status'
              ) {
                return reply.continue;
              }
              return reply
                .response(
                  new MsgResult<ResponseObject>(
                    200,
                    null,
                    'Service is currently unavailable',
                    'We are currently undergoing maintenance operations',
                    {},
                  ),
                )
                .code(200)
                .takeover();
            },
          });
        },
      });

      await server.start();
      logger().info(`API server running on ${server.info.uri}`);

      return server.listener;
    } catch (err) {
      try {
        logger().estack(err);
      } catch (ignoreErr) {
        console.error(err && err.stack ? err.stack : err);
      }

      return null;
    }
  }
}

export { Server };
