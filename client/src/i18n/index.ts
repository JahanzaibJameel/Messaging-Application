import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const fallbackLanguage = "en";
const deviceLanguage = getLocales()[0]?.languageCode ?? fallbackLanguage;

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: fallbackLanguage,
  resources,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  pluralSeparator: "_",
  compatibilityJSON: "v4", // Updated for newer i18next version
  react: {
    useSuspense: false, // Disable suspense mode for React Native
  },
});

export default i18n;
