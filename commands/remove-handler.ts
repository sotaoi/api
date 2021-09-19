import { CommandResult, ListenerEvent, ListenerEventType } from '@sotaoi/omni/transactions';
import { RemoveCommand } from '@sotaoi/api/commands';
import { BaseHandler } from '@sotaoi/api/base-handler';
import { Model } from '@sotaoi/api/db/model';
import { io } from '@sotaoi/api/io';

abstract class RemoveHandler extends BaseHandler {
  abstract model(): Promise<Model>;
  abstract handle(command: RemoveCommand): Promise<CommandResult>;

  public async __handle__(command: RemoveCommand): Promise<CommandResult> {
    const result = await this.handle(command);

    if (!this.refreshArtifact() || !result.success || !result.artifact) {
      return result;
    }

    // refresh
    io().emit(ListenerEvent(ListenerEventType.DB.Records.REMOVED, result.artifact.ref), '');

    return result;
  }

  protected refreshArtifact(): boolean {
    return true;
  }
}

export { RemoveHandler };
