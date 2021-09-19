import type { Lang } from '@sotaoi/omni/state';

class LangService {
  protected available: null | Lang[] = null;
  protected multilang = false;

  public async getLangData(): Promise<{
    'app.lang.selected': Lang;
    'app.lang.default': Lang;
    'app.lang.available': [Lang];
    'app.lang.translations': { [key: string]: { [key: string]: string } };
  }> {
    const lang: Lang = {
      code: 'en',
      name: 'English',
    };
    return {
      'app.lang.selected': lang,
      'app.lang.default': lang,
      'app.lang.available': [lang],
      'app.lang.translations': {
        en: {
          'app.general.welcome': 'Welcome to Alarmion',
        },
      },
    };
  }
}

const lang = (): LangService => {
  return new LangService();
};

export { lang };
