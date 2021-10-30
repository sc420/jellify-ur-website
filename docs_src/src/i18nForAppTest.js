import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  ns: ["App"],
  debug: true,
  interpolation: {
    escapeValue: false, // not needed for react!!
  },
  resources: {
    en: {
      App: {
        jellifyButtonText: {
          notJellified: "Click the Button to Jellify This Page",
          jellified: "Jellified! Try Scrolling Down",
        },
        jellifyButton: "Jellify",
      },
    },
  },
});

export default i18n;
