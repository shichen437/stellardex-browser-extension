type Language = "zh-CN" | "en";

type Translations = {
  [key: string]: string | Translations;
};

let translations: {
  [lang in Language]: Translations;
} = {
  "zh-CN": {},
  en: {},
};

let translationsLoaded = false;

async function loadTranslations() {
  try {
    const zhResponse = await fetch(chrome.runtime.getURL("locales/zh-CN.json"));
    const enResponse = await fetch(chrome.runtime.getURL("locales/en.json"));

    translations["zh-CN"] = await zhResponse.json();
    translations["en"] = await enResponse.json();
    translationsLoaded = true;
  } catch (error) {
    console.error("Failed to load translations:", error);
  }
}

export async function waitForTranslations() {
  if (!translationsLoaded) {
    await loadTranslations();
  }
  return translationsLoaded;
}

export function getBrowserLanguage(): Language {
  const lang = navigator.language;
  return lang.startsWith("zh") ? "zh-CN" : "en";
}

export function t(path: string): string {
  const lang = getBrowserLanguage();
  if (!translationsLoaded) {
    return path;
  }

  const keys = path.split(".");
  let current: string | Translations = translations[lang] || translations["en"];

  for (const key of keys) {
    if (typeof current === "string") {
      return path;
    }
    current = current[key];
    if (current === undefined) {
      current = translations["en"];
      for (const k of keys.slice(0, keys.indexOf(key) + 1)) {
        current = (current as Translations)?.[k];
      }
      if (current === undefined) {
        return path;
      }
    }
  }

  return typeof current === "string" ? current : path;
}
