import { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';

const repository = 'access_token';

const migrateAccessTokenTable = async (dbConnection: DatabaseConnection): Promise<any> => {
  return dbConnection.schema.createTable(repository, (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('authRecordSerial').notNullable();
    table.string('token').notNullable();
    table.boolean('rememberMe').notNullable();
    table.timestamp('expiresAt').notNullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });
};

const rollbackAccessTokenTable = async (dbConnection: DatabaseConnection): Promise<any> => {
  return dbConnection.schema.dropTableIfExists(repository);
};

export { migrateAccessTokenTable, rollbackAccessTokenTable };
