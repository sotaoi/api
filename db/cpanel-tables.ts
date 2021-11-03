import { Model } from '@sotaoi/api/db/model';
import { logger } from '@sotaoi/api/logger';

const cpanelMigrate = async (isMasterBundle: boolean): Promise<any> => {
  try {
    false && console.debug('Acknowledging "isMasterBundle" flag:', isMasterBundle);
    process.env.FLAG_MASTER_MIGRATION = 'yes';
    const migrations = (await Model.sdriver().migrate.latest())[1];
    !migrations.length && (migrations[0] = 'No new migrations');
    logger().info(`\n\nMigrate command complete:\n${migrations.join('\n')}`);
  } catch (err) {
    logger().estack(err);
  }
};

const cpanelSeed = async (isMasterBundle: boolean): Promise<any> => {
  if (isMasterBundle) {
    process.env.FLAG_MASTER_SEED = 'yes';
  }
  try {
    const seeds = (await Model.sdriver().seed.run())[0];
    !seeds.length && (seeds[0] = 'No seed files');
    logger().info(`\n\nSeeding complete:\n${seeds.join('\n')}`);
  } catch (err) {
    logger().estack(err);
  }
};
export { cpanelMigrate, cpanelSeed };
