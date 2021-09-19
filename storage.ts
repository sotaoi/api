import type { Storage } from '@sotaoi/api/contracts/storage';

const storage = (drive: string): Storage => {
  if (drive === 'main') {
    const { app } = require('@sotaoi/api/app-kernel');
    return app().get('app.system.storage');
  }
  throw new Error('drive not found');
};

export { storage };
