import { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';
import { Helper } from '@sotaoi/api/helper';
import { Config } from '@sotaoi/config';

const migrateOauthTables = async (dbConnection: DatabaseConnection): Promise<any> => {
  const appInfo = Config.getAppInfo();
  if (!appInfo) {
    throw new Error('Failed to get app info');
  }

  await dbConnection.schema.createTable('oauth_user_token', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('userSignature').notNullable();
    table.string('userUuid', 36).notNullable();
    table.string('scope').notNullable();
    table.string('oauthTokenUuid', 36).nullable();
    table.unique(['userSignature', 'userUuid', 'scope']);
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });
  await dbConnection.schema.createTable('oauth_client', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('clientId').notNullable();
    table.string('clientSecret').notNullable();
    table.text('redirectUris').notNullable();
    table.text('grants').notNullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });
  await dbConnection.schema.createTable('oauth_authorization_code', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('authorizationCode').notNullable();
    table.string('scope');
    table.timestamp('expiresAt').notNullable();
    table.string('redirectUri').notNullable();
    // table.string('clientUuid', 36).nullable().references('uuid').inTable('oauth_client').onDelete('cascade');
    // table.string('userUuid', 36).nullable().references('uuid').inTable('user').onDelete('cascade');
    table.string('clientUuid', 36).nullable();
    table.string('userSignature').nullable();
    table.string('userUuid', 36).nullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });
  await dbConnection.schema.createTable('oauth_token', (table: DatabaseConnection.CreateTableBuilder) => {
    table.bigIncrements('id').primary().unsigned();
    table.string('uuid', 36).unique().notNullable();
    table.string('authorizationCode').notNullable();
    table.string('accessToken').notNullable();
    table.timestamp('accessTokenExpiresAt').notNullable();
    table.string('scope');
    table.string('refreshToken').nullable();
    table.timestamp('refreshTokenExpiresAt').nullable();
    // table.string('clientUuid', 36).nullable().references('uuid').inTable('oauth_client').onDelete('cascade');
    // table.string('userUuid', 36).nullable().references('uuid').inTable('user').onDelete('cascade');
    table.string('clientUuid', 36).nullable();
    table.string('userUuid', 36).nullable();
    table.timestamp('createdAt').defaultTo(dbConnection.fn.now());
  });
};

const rollbackOauthTables = async (dbConnection: DatabaseConnection): Promise<any> => {
  await dbConnection.schema.dropTableIfExists('oauth_user_token');
  await dbConnection.schema.dropTableIfExists('oauth_client');
  await dbConnection.schema.dropTableIfExists('oauth_authorization_code');
  await dbConnection.schema.dropTableIfExists('oauth_token');
  await dbConnection.schema.dropTableIfExists('oauth_job');
};

const seedOauthTables = async (dbConnection: DatabaseConnection, port: string): Promise<any> => {
  const appInfo = Config.getAppInfo();
  if (!appInfo) {
    throw new Error('Failed to get app info');
  }

  if (await dbConnection.table('oauth_client').where('clientId', appInfo.bundleUid).first()) {
    return;
  }

  await dbConnection.table('oauth_client').insert({
    uuid: Helper.uuid(),
    clientId: appInfo.bundleUid,
    clientSecret: Config.get('app.oauth_secret'),
    redirectUris: JSON.stringify(['https://localhost/no/redirect']),
    grants: JSON.stringify(['authorization_code', 'refresh_token']),
  });
};

export { migrateOauthTables, rollbackOauthTables, seedOauthTables };
