import { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';

const up = async (dbConnection: DatabaseConnection): Promise<any> => {
  if (process.env.FLAG_MASTER_MIGRATION === 'yes') {
    console.info('Migrating... Flagged as master');
  }

  await dbConnection.schema.createTable('app', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('name').notNullable();
    table.string('packageName').notNullable();
    table.string('bundleUid').notNullable();
    table.string('masterKey').nullable();
    table.string('secretKey').notNullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });

  await dbConnection.schema.createTable('user', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('password').notNullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });

  await dbConnection.schema.createTable('lang', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('name').notNullable();
    table.string('code', 12).notNullable();
    table.string('flag').nullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });

  await dbConnection.schema.createTable('translation', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('appBundleUid', 36).notNullable();
    table.string('appBundleVersion', 12);
    // table.string('langUuid', 36).notNullable().references('uuid').inTable('lang');
    table.string('langUuid', 36).notNullable();
    table.text('file').notNullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
    table.unique(['uuid', 'appBundleUid', 'appBundleVersion', 'langUuid']);
  });
};

const down = async (dbConnection: DatabaseConnection): Promise<any> => {
  await dbConnection.schema.dropTableIfExists('app');
  await dbConnection.schema.dropTableIfExists('user');
  await dbConnection.schema.dropTableIfExists('lang');
  await dbConnection.schema.dropTableIfExists('translation');
};

export { up, down };
