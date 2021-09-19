import { CommandResult } from '@sotaoi/omni/transactions';
import { StoreCommand } from '@sotaoi/api/commands';
import { BaseHandler } from '@sotaoi/api/base-handler';
import { Model } from '@sotaoi/api/db/model';

abstract class StoreHandler extends BaseHandler {
  abstract getFormId(): Promise<string>;
  abstract model(): Promise<Model>;
  abstract handle(command: StoreCommand): Promise<CommandResult>;

  public async __handle__(command: StoreCommand): Promise<CommandResult> {
    return await this.handle(command);
  }
}

export { StoreHandler };
