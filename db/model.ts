import type { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';
import type { ModelOperations } from '@sotaoi/api/db/model-operations';
import { RecordEntry, RecordRef, Record } from '@sotaoi/omni/artifacts';
import { Store } from '@sotaoi/api/store';
import { dbModel, DbModel, FieldSchemaInit } from '@sotaoi/api/db/driver';
import { Config } from '@sotaoi/config';

abstract class Model {
  abstract repository(): string;
  abstract schema(): FieldSchemaInit;
  abstract hidden(): string[];
  abstract view(record: RecordEntry): Promise<RecordEntry>;

  protected static mdbc: null | DatabaseConnection = null;
  protected static sdbc: null | DatabaseConnection = null;

  public modelOperationsInstance: null | ModelOperations = null;
  protected strict = true;
  private keys: string[] = [];

  constructor() {
    const { ModelOperations } = require('@sotaoi/api/db/model-operations');
    this.modelOperationsInstance = new ModelOperations(this);
    this.keys = Object.keys({ ...this.schema(), uuid: true, createdAt: true, updatedAt: true });
    this.hidden().map((hide) => this.keys.splice(this.keys.indexOf(hide), 1));
  }

  public static setmdriver(mdbc: null | DatabaseConnection): void {
    this.mdbc = mdbc;
  }

  public static setsdriver(sdbc: null | DatabaseConnection): void {
    this.sdbc = sdbc;
  }

  public static drivername(): string {
    const drivername = dbModel('*').db.name;
    if (typeof drivername !== 'string' || !drivername) {
      throw new Error('Error getting MongoDB database name');
    }
    const appInfo = Config.getAppInfo();
    if (!appInfo) {
      throw new Error('Failed to get app info');
    }
    return `*:${appInfo.bundleUid}:driver:${drivername}`;
  }

  public static mdriver(): DatabaseConnection {
    if (!this.mdbc) {
      throw new Error('MySQL database connection error');
    }
    return this.mdbc;
  }

  public static mdrivername(): string {
    const mdrivername = this.mdbc?.client?.config?.connection?.database;
    if (typeof mdrivername !== 'string' || !mdrivername) {
      throw new Error('Error getting MySQL db name');
    }
    const appInfo = Config.getAppInfo();
    if (!appInfo) {
      throw new Error('Failed to get app info');
    }
    return `*:${appInfo.bundleUid}:mdriver:${mdrivername}`;
  }

  public static sdriver(): DatabaseConnection {
    if (!this.sdbc) {
      throw new Error('MySQL database connection error (SOTAOI Control Panel)');
    }
    return this.sdbc;
  }

  public static sdrivername(): string {
    const sdrivername = this.sdbc?.client?.config?.connection?.database;
    if (typeof sdrivername !== 'string' || !sdrivername) {
      throw new Error('Error getting MySQL (SOTAOI Control Panel) db name');
    }
    const appInfo = Config.getAppInfo();
    if (!appInfo) {
      throw new Error('Failed to get app info');
    }
    return `*:${appInfo.bundleUid}:mdriver:${sdrivername}`;
  }

  public modelOperations(): typeof ModelOperations {
    return require('@sotaoi/api/db/model-operations').ModelOperations;
  }

  public async cleanupDocs(): Promise<void> {
    await this.getModelOperations().cleanupDocs();
  }

  public async with(record: RecordEntry | RecordEntry[], relstring: string, key = 'uuid'): Promise<void> {
    const records = record instanceof Array ? record : [record];
    const [rel, relVariant = null] = relstring.split(':');
    // const _this: any = this;
    const models: { [key: string]: Model } = {};
    const refs: { [key: string]: string[] } = {};
    for (const record of records) {
      if (typeof record[rel] !== 'string' || !record[rel]) {
        return;
      }
      const recordRef = RecordRef.deserialize(record[rel]);
      !models[recordRef.repository] && (models[recordRef.repository] = Store.getModel(recordRef.repository) as any);
      !refs[recordRef.repository] && (refs[recordRef.repository] = []);
      refs[recordRef.repository].push(recordRef.uuid);
    }
    for (const [repository, model] of Object.entries(models)) {
      if (!model) {
        continue;
      }
      const modelDb = this.modelOperations().mget(model.repository());
      const relRecords: { [key: string]: RecordEntry } = {};
      for (const relRecord of (await modelDb.whereIn(key, refs[repository])) || []) {
        relRecords[new RecordRef(rel, relRecord.uuid).serialize()] = await model.transform(
          Record.make(relRecord),
          relVariant,
        );
      }
      records.map((record) => {
        record[rel] && (record[rel] = relRecords[record[rel]]);
      });
    }
  }

  public db(): DbModel<any> {
    return this.modelOperations().get(this.repository());
  }

  public mdb(): DatabaseConnection.QueryBuilder {
    if (!Model.mdbc) {
      throw new Error('MySQL database connection error');
    }
    return Model.mdbc(this.repository());
  }

  public sdb(): DatabaseConnection.QueryBuilder {
    if (!Model.sdbc) {
      throw new Error('MySQL database connection error (SOTAOI Control Panel)');
    }
    return Model.sdbc(this.repository());
  }

  public isStrict(): boolean {
    return this.strict;
  }

  // todo lowprio: move transform to model operations
  public async transform(record: Record, variant: null | string): Promise<RecordEntry> {
    const keys = [...this.keys];
    Object.keys(record).map((key) => {
      if (keys.indexOf(key) === -1) {
        delete record[key];
        return;
      }
      keys.splice(keys.indexOf(key), 1);
      record[key] = record[key] || null; // avoid undefined
    });
    keys.map((key) => (record[key] = record[key] || null));
    const recordEntry = new RecordEntry(this.repository(), record.uuid, record);
    const _this: any = this;
    return !variant || typeof _this[variant] !== 'function'
      ? await this.view(recordEntry)
      : await _this[variant](recordEntry);
  }

  private getModelOperations(): ModelOperations {
    if (this.modelOperationsInstance) {
      return this.modelOperationsInstance;
    }
    const modelOperationsClass = this.modelOperations();
    // @ts-ignore
    this.modelOperationsInstance = new modelOperationsClass(this);
    return this.modelOperationsInstance;
  }
}

export { Model };
