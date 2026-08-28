import { describe, it, expect, beforeEach } from "vitest";
import { zh } from "./locales/zh";
import { en } from "./locales/en";
import { useI18nStore } from "./i18nStore";

describe("i18n system", () => {
  beforeEach(() => {
    localStorage.clear();
    useI18nStore.getState().setLocale("zh");
  });

  it("has matching keys across zh and en dictionaries", () => {
    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      const keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          keys.push(...getKeys(v as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    }

    const zhKeys = getKeys(zh as unknown as Record<string, unknown>);
    const enKeys = getKeys(en as unknown as Record<string, unknown>);

    expect(zhKeys).toEqual(enKeys);
  });

  it("defaults to zh locale", () => {
    expect(useI18nStore.getState().locale).toBe("zh");
    expect(useI18nStore.getState().t.nav.templateEditorTab).toBe("模板设计");
  });

  it("switches to en locale and updates translations", () => {
    useI18nStore.getState().setLocale("en");
    expect(useI18nStore.getState().locale).toBe("en");
    expect(useI18nStore.getState().t.nav.templateEditorTab).toBe("Template Design");
    expect(localStorage.getItem("monthloom_locale")).toBe("en");
  });

  it("toggles locale between zh and en", () => {
    useI18nStore.getState().setLocale("zh");
    useI18nStore.getState().toggleLocale();
    expect(useI18nStore.getState().locale).toBe("en");
    useI18nStore.getState().toggleLocale();
    expect(useI18nStore.getState().locale).toBe("zh");
  });
});
