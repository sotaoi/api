import { Model } from '@sotaoi/api/db/model';
import { Helper } from '@sotaoi/api/helper';
import { Config } from '@sotaoi/config';
import { GenericModel } from '@sotaoi/api/db/generic-model';

const seed = async (): Promise<any> => {
  const appInfo = Config.getAppInfo();
  if (!appInfo) {
    throw new Error('Failed to get app info');
  }

  let masterKey: null | string = null;
  const secretKey = Config.sget('app.bundle_secret');
  if (process.env.FLAG_MASTER_SEED === 'yes') {
    masterKey = secretKey;
  }

  const appRecord = await new GenericModel('app').sdb().where('packageName', Config.sget('app.package_name')).first();
  if (appRecord) {
    return;
  }

  await Model.sdriver()
    .table('app')
    .insert({
      uuid: Helper.uuid(),
      name: Config.get('app.name'),
      packageName: Config.get('app.package_name'),
      bundleUid: appInfo.bundleUid,
      masterKey,
      secretKey,
    });
};

export { seed };
