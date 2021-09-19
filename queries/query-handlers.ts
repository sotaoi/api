import { FlistQuery, QueryResult, PlistQuery, SlistQuery } from '@sotaoi/omni/transactions';
import { BaseHandler } from '@sotaoi/api/base-handler';
import { Errors } from '@sotaoi/omni/errors';
import { RecordEntry, Record } from '@sotaoi/omni/artifacts';
import { Model } from '@sotaoi/api/db/model';

abstract class QueryHandler extends BaseHandler {
  abstract model(): Promise<Model>;
  abstract handle(query: FlistQuery | PlistQuery | SlistQuery): Promise<QueryResult>;

  public async __handle__(query: FlistQuery | PlistQuery | SlistQuery): Promise<QueryResult> {
    const result = await this.handle(query);
    result.records &&
      result.records.map((record) => {
        if (!(record instanceof RecordEntry)) {
          throw new Errors.ResultIsCorrupt();
        }
      });
    return result;
  }

  public async transform(records: Record[], variant: null | string): Promise<RecordEntry[]> {
    const model = await this.model();
    const recordEntries: RecordEntry[] = [];
    for (const record of records) {
      recordEntries.push(await model.transform(record, variant));
    }
    return recordEntries;
  }
}

abstract class FlistQueryHandler extends QueryHandler {
  abstract handle(query: FlistQuery): Promise<QueryResult>;
}

abstract class PlistQueryHandler extends QueryHandler {
  abstract handle(query: PlistQuery): Promise<QueryResult>;
}

abstract class SlistQueryHandler extends QueryHandler {
  abstract handle(query: SlistQuery): Promise<QueryResult>;
}

export { QueryHandler, FlistQueryHandler, PlistQueryHandler, SlistQueryHandler };
