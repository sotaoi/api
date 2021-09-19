import { TaskCommand } from '@sotaoi/api/commands';

const InstallBundleHelper = async (task: TaskCommand, isMaster: boolean) => {
  if (!isMaster) {
    // handle non master bundle

    return;
  }

  // handle master bundle
};

export { InstallBundleHelper };
