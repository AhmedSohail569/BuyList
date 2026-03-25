/**
 * LanguageContext
 *
 * Provides the `language` setting and `setLanguage` action to the entire app.
 * Reads from Redux `settings.language` so the value persists via redux-persist.
 * Changing language is instant — no reload required.
 */
import { createContext, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "~redux/reducers/settingsReducer";

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }) => {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.settings.language);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (lang) => dispatch(setLanguage(lang)),
    }),
    [language, dispatch],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
