import { TaskResult } from '@sotaoi/omni/transactions';
import { logger } from '@sotaoi/api/logger';
import { TaskHandler } from '@sotaoi/api/commands/task-handler';
import { TaskCommand } from '@sotaoi/api/commands';
import fs from 'fs';
import path from 'path';
import { Helper } from '@sotaoi/api/helper';
import { InstallBundleHelper } from '@sotaoi/api/control-panel/helpers/install-bundle-helper';
import { ErrorCode } from '@sotaoi/omni/errors';

class InstallBundleHandler extends TaskHandler {
  public getFormId = async (): Promise<string> => 'install-bundle-task';

  public async handle(task: TaskCommand): Promise<TaskResult> {
    try {
      const BundleJson = Helper.getBundleJson();
      if (BundleJson.installed) {
        throw new Error('Bundle is already installed');
      }

      await InstallBundleHelper(task, false);

      BundleJson.installed = true;
      BundleJson.master = false;
      fs.writeFileSync(path.resolve('./sotaoi/omni/bundle.json'), JSON.stringify(BundleJson, null, 2));
      return new TaskResult(200, null, 'Install success', 'Install was successful', { ok: true }, null, {});
    } catch (err) {
      logger().estack(err);
      return new TaskResult(
        400,
        ErrorCode.APP_GENERIC_ERROR,
        'Install failed',
        'Install was not successful',
        { ok: false },
        null,
        {},
      );
    }
  }
}

export { InstallBundleHandler };
