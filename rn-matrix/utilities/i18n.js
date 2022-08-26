import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from '../../locales/en.json';
import zhHans from '../../locales/zh-Hans.json';

const resources = {
  en: en,
  'zh-Hans': zhHans,
};

const fallback = {languageTag: 'en', isRTL: false};
const locale =
  RNLocalize.findBestAvailableLanguage(Object.keys(resources)) || fallback;

const languageDetector = {
  init: Function.prototype,
  type: 'languageDetector',
  detect: () => locale.languageTag,
  cacheUserLanguage: Function.prototype,
};

i18n
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    fallbackLng: 'en',
    debug: false,
    resources,
    ns: ['auth', 'messages', 'settings', 'newChat', 'home'],
    react: {
      useSuspense: false,
    },
  });

export default i18n;
