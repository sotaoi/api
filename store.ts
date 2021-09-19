import { StoreHandler } from '@sotaoi/api/commands/store-handler';
import { UpdateHandler } from '@sotaoi/api/commands/update-handler';
import { QueryHandler } from '@sotaoi/api/queries/query-handlers';
import { RetrieveHandler } from '@sotaoi/api/queries/retrieve-handler';
import { RemoveHandler } from '@sotaoi/api/commands/remove-handler';
import { AuthHandler } from '@sotaoi/api/commands/auth-handler';
import { TaskHandler } from '@sotaoi/api/commands/task-handler';
import { FormValidations } from '@sotaoi/omni/input/base-input';
import { QueryFilters, ScopedRequests } from '@sotaoi/omni/transactions';
import { ResponseToolkit } from '@hapi/hapi';
import { Model } from '@sotaoi/api/db/model';
import { controlPanelForms } from '@sotaoi/api/forms/control-panel-forms';
import { InstallMasterBundleHandler } from '@sotaoi/api/control-panel/commands/generic/install-master-bundle-handler';
import { InstallBundleHandler } from '@sotaoi/api/control-panel/commands/generic/install-bundle-handler';
import { Helper } from '@sotaoi/api/helper';
import { AuthMaintainerHandler } from '@sotaoi/api/control-panel/commands/maintainer/auth-maintainer-handler';
import { AppInfo, AppPocket, AppPocketInterface } from '@sotaoi/omni/state';
import { GenericModel } from '@sotaoi/api/db/generic-model';
import { logger } from '@sotaoi/api/logger';
import { Config } from '@sotaoi/config';

interface RepositoryHandlers {
  store?: typeof StoreHandler;
  update?: typeof UpdateHandler;
  query?: { [key: string]: typeof QueryHandler };
  retrieve?: typeof RetrieveHandler;
  remove?: typeof RemoveHandler;
  auth?: typeof AuthHandler;
  task?: { [key: string]: typeof TaskHandler };
}

const controlPanelHandlers: RepositoryHandlers = {
  auth: AuthMaintainerHandler,
  task: {
    'install-master-bundle-task': InstallMasterBundleHandler,
    'install-bundle-task': InstallBundleHandler,
  },
};

class Store {
  protected static appInfo: null | AppInfo = null;
  protected static handlers: { [key: string]: RepositoryHandlers } = {};
  protected static models: { [key: string]: Model } = {};
  protected static forms: { [key: string]: { [key: string]: FormValidations } } = {};
  protected static scopedRequests: null | ScopedRequests = null;
  protected static maintenance = false;

  public static async init(
    appInfo: AppInfo,
    handlers: { [key: string]: RepositoryHandlers },
    formSet: { [key: string]: { [key: string]: () => Promise<FormValidations> } },
    scopedRequests: null | ScopedRequests,
  ): Promise<void> {
    this.appInfo = appInfo;
    this.handlers = handlers;
    this.forms = {};
    this.scopedRequests = scopedRequests;
    for (const [repository, form] of Object.entries(formSet)) {
      this.forms[repository] = {};
      for (const [formId, validations] of Object.entries(form)) {
        this.forms[repository][formId] = await validations();
      }
    }
  }

  public static getStoreHandler(repository: string, handler: ResponseToolkit): StoreHandler {
    const storeHandler = this.handlers[repository].store;
    if (!storeHandler) {
      throw new Error('no handler found');
    }
    return new (storeHandler as any)(handler);
  }
  public static getUpdateHandler(repository: string, handler: ResponseToolkit): UpdateHandler {
    const updateHandler = this.handlers[repository].update;
    if (!updateHandler) {
      throw new Error('no handler found');
    }
    return new (updateHandler as any)(handler);
  }
  public static getQueryHandler<Filters extends QueryFilters>(
    repository: string,
    list: string,
    handler: ResponseToolkit,
  ): QueryHandler {
    const queryHandlers = this.handlers[repository].query;
    if (!queryHandlers || !queryHandlers[list]) {
      throw new Error('no handler found');
    }
    return new (queryHandlers[list] as any)(handler);
  }
  public static getRetrieveHandler(repository: string, handler: ResponseToolkit): RetrieveHandler {
    const retrieveHandler = this.handlers[repository].retrieve;
    if (!retrieveHandler) {
      throw new Error('no handler found');
    }
    return new (retrieveHandler as any)(handler);
  }
  public static getRemoveHandler(repository: string, handler: ResponseToolkit): RemoveHandler {
    const removeHandler = this.handlers[repository].remove;
    if (!removeHandler) {
      throw new Error('no handler found');
    }
    return new (removeHandler as any)(handler);
  }
  // get remove handler
  public static getAuthHandler(repository: string, handler: ResponseToolkit): AuthHandler {
    try {
      const authHandler = this.handlers[repository].auth;
      if (!authHandler) {
        throw new Error('no handler found');
      }
      return new (authHandler as any)(handler);
    } catch (err) {
      // control panel auth
      if (repository === 'sotaoi-maintainer') {
        return new (controlPanelHandlers.auth as any)(handler);
      }
      throw err;
    }
  }
  public static getTaskHandler(repository: string, task: string, handler: ResponseToolkit): TaskHandler {
    try {
      const taskHandlers = this.handlers[repository].task;
      if (!taskHandlers || !taskHandlers[task]) {
        throw new Error('no handler found');
      }
      return new (taskHandlers[task] as any)(handler);
    } catch (err) {
      // control panel tasks for uninstalled bundles
      if (!Helper.getBundleJson().installed && controlPanelHandlers.task && controlPanelHandlers.task[task]) {
        return new (controlPanelHandlers.task[task] as any)(handler);
      }
      throw err;
    }
  }

  public static getModel(key: string): Model {
    return this.models[key] || null;
  }

  public static async getForm(repository: string, formId: string): Promise<FormValidations> {
    if (!this.forms[repository] || !this.forms[repository][formId]) {
      if (repository === 'sotaoi-maintainer') {
        return await controlPanelForms[formId]();
      }
      if (!Helper.getBundleJson().installed && controlPanelForms[formId]) {
        return await controlPanelForms[formId]();
      }
      throw new Error('form does not exist');
    }
    return this.forms[repository][formId];
  }

  public static getScopedRequests(): null | ScopedRequests {
    return this.scopedRequests;
  }

  public static driverDomainSignature(): string {
    return `*:${Config.getAppInfo()?.bundleUid}:driver:${Config.getAppInfo()?.signature1}`;
  }
  public static driverDomainRepoSignature(repository: string): string {
    return `*:${Config.getAppInfo()?.bundleUid}:driver:${Config.getAppInfo()?.signature1}:${repository}`;
  }

  public static mdriverDomainSignature(): string {
    return `*:${Config.getAppInfo()?.bundleUid}:mdriver:${Config.getAppInfo()?.signature1}`;
  }
  public static mdriverDomainRepoSignature(repository: string): string {
    return `*:${Config.getAppInfo()?.bundleUid}:mdriver:${Config.getAppInfo()?.signature1}:${repository}`;
  }

  public static sdriverDomainSignature(): string {
    return `*:${Config.getAppInfo()?.bundleUid}:sdriver:${Config.getAppInfo()?.signature2}`;
  }
  public static sdriverDomainRepoSignature(repository: string): string {
    return `*:${Config.getAppInfo()?.bundleUid}:sdriver:${Config.getAppInfo()?.signature2}:${repository}`;
  }

  //

  public static getCachedMaintenanceFlag(): boolean {
    return !!this.maintenance;
  }

  public static async setMaintenance(maintenanceState: boolean): Promise<void> {
    const appInfo = Config.getAppInfo();
    if (!appInfo) {
      throw new Error('Failed to get app info');
    }
    const appPocket = await this.ensureAppPocket();
    appPocket.coreState.appMaintenance = !!maintenanceState;
    this.maintenance = !!appPocket.coreState.appMaintenance;
    await new GenericModel('app')
      .sdb()
      .where('bundleUid', appInfo.bundleUid)
      .update({
        pocket: JSON.stringify(appPocket),
      });
  }

  public static async isAppInMaintenance(): Promise<boolean> {
    try {
      this.maintenance = !!(await this.ensureAppPocket()).coreState.appMaintenance;
      return this.maintenance;
    } catch (err) {
      logger().error(err);
      return false;
    }
  }

  //

  public static async ensureAppPocket(): Promise<AppPocketInterface> {
    const appInfo = Config.getAppInfo();
    if (!appInfo) {
      throw new Error('Failed to get app info');
    }
    const appRecord = await new GenericModel('app').sdb().where('bundleUid', appInfo.bundleUid).first();
    if (!appRecord) {
      return new AppPocket({}, appInfo);
    }
    appRecord.pocket = JSON.parse(appRecord.pocket);
    const appPocket = new AppPocket(appRecord ? appRecord.pocket : null, appInfo);
    if (!Object.keys(appRecord.pocket).length) {
      await new GenericModel('app')
        .sdb()
        .where('bundleUid', appInfo.bundleUid)
        .update({
          pocket: JSON.stringify(appPocket.toObject()),
        });
    }
    this.maintenance = !!appPocket.coreState.appMaintenance;
    return appPocket.toObject();
  }
}

export { Store };
export type { RepositoryHandlers };
