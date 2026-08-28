import { create } from "zustand";
import type { Locale, TranslationDictionary } from "./types";
import { zh } from "./locales/zh";
import { en } from "./locales/en";

const STORAGE_KEY = "monthloom_locale";

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  zh,
  en,
};

function getInitialLocale(): Locale {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") {
        return saved;
      }
    }
  } catch {
    // Ignore storage access errors
  }
  return "zh";
}

interface I18nState {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
}

export const useI18nStore = create<I18nState>((set, get) => {
  const initialLocale = getInitialLocale();
  return {
    locale: initialLocale,
    t: DICTIONARIES[initialLocale],
    setLocale: (next: Locale) => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, next);
        }
      } catch {
        // Ignore storage errors
      }
      set({
        locale: next,
        t: DICTIONARIES[next],
      });
    },
    toggleLocale: () => {
      const next = get().locale === "zh" ? "en" : "zh";
      get().setLocale(next);
    },
  };
});

/**
 * Convenient hook returning { t, locale, setLocale, toggleLocale }
 */
export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  const t = useI18nStore((s) => s.t);
  const setLocale = useI18nStore((s) => s.setLocale);
  const toggleLocale = useI18nStore((s) => s.toggleLocale);

  return { t, locale, setLocale, toggleLocale };
}

/**
 * Non-reactive helper to get current translation dictionary
 */
export function getT(): TranslationDictionary {
  return useI18nStore.getState().t;
}

/**
 * Non-reactive helper to get current locale
 */
export function getLocale(): Locale {
  return useI18nStore.getState().locale;
}
