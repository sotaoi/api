import { CommandResult, ListenerEvent, ListenerEventType } from '@sotaoi/omni/transactions';
import { UpdateCommand } from '@sotaoi/api/commands';
import { BaseHandler } from '@sotaoi/api/base-handler';
import { io } from '@sotaoi/api/io';
import { Model } from '@sotaoi/api/db/model';
import { logger } from '@sotaoi/api/logger';

abstract class UpdateHandler extends BaseHandler {
  abstract getFormId(): Promise<string>;
  abstract model(): Promise<Model>;
  abstract handle(command: UpdateCommand): Promise<CommandResult>;

  public async __handle__(command: UpdateCommand): Promise<CommandResult> {
    const result = await this.handle(command);

    if (!this.refreshArtifact() || !result.success || !result.artifact) {
      return result;
    }

    // refresh
    try {
      io().emit(ListenerEvent(ListenerEventType.DB.Records.UPDATED, result.artifact.ref), '');
    } catch (err) {
      logger().error(err);
    }

    return result;
  }

  protected refreshArtifact(): boolean {
    return false;
  }
}

export { UpdateHandler };
