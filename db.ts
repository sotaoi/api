import mongoose from 'mongoose';
import { Config } from '@sotaoi/config';
import { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';
import path from 'path';
const knex = require('knex');

let connected = false;
let mconnected = false;
let sconnected = false;

// mongo app database
const connect = async (): Promise<void> => {
  if (connected) {
    return;
  }
  connected = true;
  const dbConfig = Config.get('db') as { [key: string]: any };
  await mongoose.connect(
    `mongodb://${dbConfig.connection.host}:${dbConfig.connection.mongo_port}/${dbConfig.connection.database}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );
};

// mysql app database
const mconnect = async (): Promise<void> => {
  if (mconnected) {
    return;
  }
  mconnected = true;
  const dbConfig = Config.get('db') as { [key: string]: any };

  const { Model } = require('@sotaoi/api/db/model');
  Model.setmdriver(
    (await knex({
      client: 'mysql',
      connection: {
        host: dbConfig.connection.host,
        user: dbConfig.connection.user,
        password: dbConfig.connection.password,
        database: dbConfig.connection.database,
      },
      migrations: {
        directory: path.resolve(dbConfig.migrations_path),
      },
      seeds: {
        directory: path.resolve(dbConfig.seeds_path),
      },
    } as DatabaseConnection.Config)) as DatabaseConnection,
  );
};

// mysql sotaoi control panel database
const sconnect = async (): Promise<void> => {
  if (sconnected) {
    return;
  }
  sconnected = true;
  const dbConfig = Config.get('db') as { [key: string]: any };

  const { Model } = require('@sotaoi/api/db/model');
  Model.setsdriver(
    (await knex({
      client: 'mysql',
      connection: {
        host: dbConfig.connection.host,
        user: dbConfig.connection.user,
        password: dbConfig.connection.password,
        database: dbConfig.connection.control_panel_database,
      },
      migrations: {
        directory: path.resolve(path.dirname(require.resolve('@sotaoi/api/package.json')), 'db', 'migrations'),
      },
      seeds: {
        directory: path.resolve(path.dirname(require.resolve('@sotaoi/api/package.json')), 'db', 'seeds'),
      },
    } as DatabaseConnection.Config)) as DatabaseConnection,
  );
};

const migrate = async (): Promise<any> => {
  const { Model } = require('@sotaoi/api/db/model');
  return Model.mdriver().migrate.latest();
};

const rollback = async (): Promise<any> => {
  const { Model } = require('@sotaoi/api/db/model');
  return Model.mdriver().migrate.rollback();
};

const down = async (): Promise<any> => {
  const { Model } = require('@sotaoi/api/db/model');
  return Model.mdriver().migrate.down();
};

const seed = async (): Promise<any> => {
  const { Model } = require('@sotaoi/api/db/model');
  return Model.mdriver().seed.run();
};

export { connect, mconnect, sconnect, migrate, rollback, down, seed };
