import { TaskResult } from '@sotaoi/omni/transactions';
import { TaskCommand } from '@sotaoi/api/commands';
import { BaseHandler } from '@sotaoi/api/base-handler';

abstract class TaskHandler extends BaseHandler {
  abstract getFormId(): Promise<string>;
  abstract handle(command: TaskCommand): Promise<TaskResult>;

  public async __handle__(command: TaskCommand): Promise<TaskResult> {
    return await this.handle(command);
  }
}

export { TaskHandler };
