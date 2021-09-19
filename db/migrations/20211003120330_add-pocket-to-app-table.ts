import { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';
import { Model } from '@sotaoi/api/db/model';

const up = async (dbConnection: DatabaseConnection): Promise<any> => {
  false && console.debug('Acknowledging dbConnection:', dbConnection);
  await Model.sdriver().raw('ALTER TABLE `app` ADD COLUMN `pocket` JSON NOT NULL DEFAULT ("{}") AFTER `bundleUid`;');
  await dbConnection.schema.alterTable('app', (table: DatabaseConnection.AlterTableBuilder) => {
    table.timestamp('updatedAt').defaultTo(dbConnection.fn.now()).after('createdAt');
  });
};

const down = async (dbConnection: DatabaseConnection): Promise<any> => {
  await dbConnection.schema.alterTable('app', (table: DatabaseConnection.AlterTableBuilder) => {
    table.dropColumn('pocket');
  });
};

export { up, down };
