import {type LocaleStr, narrowLocaleString} from "@nextutils/locales";
import {PRODUCT_DOMAIN} from "../productConstants";

export const defaultLocale = {"locale": "en", "lang": "English"} as const;

// extracted wordpress.com
const locales = [
  defaultLocale,
  {"locale": "es", "lang": "Español"},
  {"locale": "pt-br", "lang": "Português do Brasil"},
  {"locale": "de", "lang": "Deutsch"},
  {"locale": "fr", "lang": "Français"},
  {"locale": "he", "lang": "עִבְרִית"},
  {"locale": "ja", "lang": "日本語"},
  {"locale": "it", "lang": "Italiano"},
  {"locale": "nl", "lang": "Nederlands"},
  {"locale": "ru", "lang": "Русский"},
  {"locale": "tr", "lang": "Türkçe"},
  {"locale": "id", "lang": "Bahasa Indonesia"},
  {"locale": "zh-cn", "lang": "简体中文"},
  {"locale": "zh-tw", "lang": "繁體中文"},
  {"locale": "ko", "lang": "한국어"},
  {"locale": "ar", "lang": "العربية"},
  {"locale": "sv", "lang": "Svenska"}
] as const;

export const langMap = locales.reduce((map, l) => {
  map[l.locale] = l.lang;
  return map;
}, {} as Record<LocaleStr, string>);

const PREF_PREFIX = 'fontsensei'

export const setPreferredLocaleInBrowser = (preferredLocale: LocaleStr) => {
  localStorage.setItem(`${PREF_PREFIX}.preferences.locale`, preferredLocale);
};


export const getPreferredLocaleInBrowser = () => {
  return narrowLocaleString(
    localStorage.getItem(`${PREF_PREFIX}.preferences.locale`) ?? undefined
  );
};

export const fallbackLocale = 'en' as const;

export const getCanonicalPath = (
  locale: string,
  asPath: string // use router.asPath
) => {
  return `${
    locale === fallbackLocale ? '' : '/' + locale
  }${
    asPath === '/' ? '' : asPath
  }`
}

// Fix this on vercel
// https://github.com/vercel/next.js/issues/72063
export const hackAsPath = (asPath: string) => {
  let finalPath = asPath;
  for (const l of locales) {
    if (asPath.startsWith('/' + l.locale)) {
      finalPath = finalPath.slice(('/' + l.locale).length);
      break;
    }
  }

  // remove the parameter nxtPslugList
  finalPath = finalPath.split('?')[0]!;

  return finalPath;
};

export const getCanonicalUrl = (
  locale: string,
  asPath: string // use router.asPath
) => {
  return `https://${
    PRODUCT_DOMAIN
  }${
    locale === fallbackLocale ? '' : '/' + locale
  }${
    hackAsPath(asPath) === '/' ? '' : hackAsPath(asPath)
  }`
};


export default locales;
