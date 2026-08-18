/**
 * Configuration i18next — La Citadelle Numérique
 * Langues supportées : fr (défaut), en
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";
import en from "./en.json";

const savedLang = localStorage.getItem("citadelle_lang") || "fr";

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: savedLang,
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });

// Synchronise l'attribut lang sur <html>
const syncHtmlLang = (lang) => {
  document.documentElement.setAttribute("lang", lang);
};
syncHtmlLang(savedLang);
i18n.on("languageChanged", (lang) => {
  localStorage.setItem("citadelle_lang", lang);
  syncHtmlLang(lang);
});

export default i18n;
