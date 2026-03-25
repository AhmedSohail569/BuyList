/**
 * useTranslation Hook
 *
 * Returns a memoized `t(key, params?)` function for translating strings.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   <Text>{t("home_circle_updates")}</Text>
 *   <Text>{t("lists_delete_message", { name: "My List" })}</Text>
 *
 * Falls back to English if a key is missing in the selected language.
 * Supports simple interpolation: t("key", { name: "World" }) replaces {{name}}.
 */
import { useMemo } from "react";
import { useLanguage } from "~context/LanguageContext";
import { translations } from "~translations";

const useTranslation = () => {
  const { language } = useLanguage();

  const t = useMemo(() => {
    const dict = translations[language] || translations.en;
    const fallback = translations.en;

    return (key, params) => {
      let str = dict[key] ?? fallback[key] ?? key;

      // Simple parameter interpolation: {{paramName}}
      if (params && typeof params === "object") {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }

      return str;
    };
  }, [language]);

  return { t };
};

export default useTranslation;
