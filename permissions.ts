import type { Permissions } from '@sotaoi/api/contracts/permissions';

const permissions = (): Permissions => {
  const { app } = require('@sotaoi/api/app-kernel');
  return app().get('app.system.permissions');
};

export { permissions };
