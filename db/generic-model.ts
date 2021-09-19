import type { FieldSchemaInit } from '@sotaoi/api/db/driver';
import type { RecordEntry } from '@sotaoi/omni/artifacts';
import { Model } from '@sotaoi/api/db/model';

class GenericModel extends Model {
  protected strict: boolean;
  private _repository: string;

  constructor(repository: string) {
    super();
    this.strict = false;
    this._repository = repository;
  }

  public schema(): FieldSchemaInit {
    return GenericModel.genericSchema();
  }

  public repository(): string {
    return this._repository;
  }

  public hidden(): string[] {
    return [];
  }

  public async view(record: RecordEntry): Promise<RecordEntry> {
    return record;
  }

  public static genericSchema(): FieldSchemaInit {
    return {
      uuid: {
        type: String,
        index: {
          unique: true,
        },
      },
      createdAt: {
        type: Date,
      },
      updatedAt: {
        type: Date,
      },
    };
  }
}

export { GenericModel };
