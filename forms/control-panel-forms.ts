import { FormValidations } from '@sotaoi/omni/input/base-input';

const controlPanelForms: { [key: string]: () => Promise<FormValidations> } = {
  'install-master-bundle-task': async () => ({}),

  'install-bundle-task': async () => ({}),

  'auth-maintainer-form': async () => ({
    email: [{ method: 'required' }],
    password: [{ method: 'required' }],
  }),
};

export { controlPanelForms };
