import { Command } from '@sotaoi/omni/transactions';
import { AuthRecord, Artifacts } from '@sotaoi/omni/artifacts';
import { FieldValidation } from '@sotaoi/omni/input/base-input';

//

class StoreCommand extends Command {
  public payload: { [key: string]: any };

  constructor(
    authRecord: null | AuthRecord,
    artifacts: Artifacts,
    role: null | string,
    repository: string,
    payload: { [key: string]: any },
  ) {
    super(authRecord, artifacts, role, repository);
    this.payload = payload;
  }
}
class UpdateCommand extends StoreCommand {
  public uuid: string;

  constructor(
    authRecord: null | AuthRecord,
    artifacts: Artifacts,
    role: null | string,
    repository: string,
    uuid: string,
    payload: { [key: string]: any },
  ) {
    super(authRecord, artifacts, role, repository, payload);
    this.uuid = uuid;
  }
}

class RemoveCommand extends Command {
  public uuid: string;

  constructor(
    authRecord: null | AuthRecord,
    artifacts: Artifacts,
    role: null | string,
    repository: string,
    uuid: string,
  ) {
    super(authRecord, artifacts, role, repository);
    this.uuid = uuid;
  }
}

class AuthCommand extends Command {
  public payload: { [key: string]: any };
  public strategy: string;

  constructor(artifacts: Artifacts, repository: string, payload: { [key: string]: any }, strategy: string) {
    super(null, artifacts, '', repository);
    this.payload = payload;
    this.strategy = strategy;
  }
}

class TaskCommand extends Command {
  public payload: { [key: string]: any };
  public task: string;

  constructor(
    authRecord: null | AuthRecord,
    artifacts: Artifacts,
    role: null | string,
    repository: string,
    task: string,
    payload: { [key: string]: any },
  ) {
    super(authRecord, artifacts, role, repository);
    this.payload = payload;
    this.task = task;
  }
}

//

class FormPayload {
  public payload: { [key: string]: any };

  constructor(payload: { [key: string]: any }) {
    this.payload = payload;
  }
}

class FieldPayload<FieldValue> {
  name: string;
  value: FieldValue;
  validations: FieldValidation[];

  constructor(name: string, value: FieldValue, validations: FieldValidation[]) {
    this.name = name;
    this.value = value;
    this.validations = validations;
  }
}

export { StoreCommand, UpdateCommand, RemoveCommand, AuthCommand, TaskCommand, FieldPayload, FormPayload };
