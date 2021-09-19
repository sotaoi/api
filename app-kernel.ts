import type { AppContainer } from '@sotaoi/api/app-container';
import type { InputValidator } from '@sotaoi/omni/contracts/input-validator';
import type { Logger } from '@sotaoi/api/contracts/logger';
import type { Permissions } from '@sotaoi/api/contracts/permissions';
import type { LoggerService } from '@sotaoi/api/services/logger-service';
import type { PermissionsService } from '@sotaoi/api/services/permissions-service';
import type { ResponseToolkit } from '@hapi/hapi';
import type { StorageService } from '@sotaoi/api/services/storage-service';
import type { Storage, StoredItem } from '@sotaoi/api/contracts/storage';
import { GenericModel } from '@sotaoi/api/db/generic-model';
import { InputValidatorService } from '@sotaoi/omni/services/input-validator-service';
import { Config } from '@sotaoi/config';

let appContainer: AppContainer;
let app: () => AppContainer = () => {
  if (!appContainer) {
    new AppKernel();
    return appContainer;
  }
  return appContainer;
};

class AppKernel {
  public bootstrapped: boolean;

  constructor() {
    const { AppContainer } = require('@sotaoi/api/app-container');
    this.bootstrapped = false;
    appContainer = new AppContainer((key: undefined | null | number | string) => {
      typeof key === 'number' && (key = key.toString());
      if (typeof key === 'string') {
        return Config.get(key);
      }
      return null;
    });
  }

  public bootstrap(registerFn: void | ((app: () => AppContainer) => void)): AppKernel {
    if (!this.bootstrapped) {
      this.bootstrapped = true;
      AppKernel.bootstrap();
    }
    if (registerFn) {
      registerFn(app);
    }
    return this;
  }

  protected static bootstrap(): void {
    //

    // logger
    !app().has('app.system.logger') &&
      app().singleton<Logger>('app.system.logger', (): LoggerService => {
        const { LoggerService } = require('@sotaoi/api/services/logger-service');
        const config = app().config('logger');
        return new LoggerService(config.log_path);
      });

    // input validator
    !app().has('app.system.inputValidator') &&
      app().singleton<InputValidator>('app.system.inputValidator', (): InputValidatorService => {
        return new InputValidatorService({}, () => new GenericModel('').mdb, null);
      });

    // permissions
    !app().has('app.system.permissions') &&
      app().singleton<Permissions>('app.system.permissions', (): PermissionsService => {
        const { PermissionsService } = require('@sotaoi/api/services/permissions-service');
        return new PermissionsService();
      });

    // storage
    !app().has('app.system.storage') &&
      app().singleton<Storage>('app.system.storage', (): StorageService => {
        const { StorageService } = require('@sotaoi/api/services/storage-service');
        const path = require('path');
        return new StorageService({
          drive: 'main',
          relativeTo: path.resolve('./storage'),
          rule: async (handler: ResponseToolkit, role: string, item: StoredItem): Promise<boolean> => {
            // const accessToken = AuthHandler.getAccessToken(handler);
            // console.info('checking storage permissions');
            // console.info('role:', role);
            // console.info('domain:', item.domain);
            // console.info('pathame:', item.pathname);
            // console.info('access token:', accessToken);
            // console.info('auth record:', await AuthHandler.translateAccessToken(handler, accessToken));
            if (item.domain === 'public') {
              return true;
            }
            return false;
          },
        });
      });

    //
  }
}

export { AppKernel, app };
