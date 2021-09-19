import type { Logger } from '@sotaoi/api/contracts/logger';

const logger = (): Logger => {
  const { app } = require('@sotaoi/api/app-kernel');
  return app().get('app.system.logger');
};

export { logger };
