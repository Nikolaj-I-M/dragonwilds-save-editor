/**
 * i18n mínimo: strings de UI por idioma + overrides de nomes de itens e
 * categorias (gerados por scripts/build_catalog.py).
 */

import en from "@/data/i18n/en.json";
import ptBR from "@/data/i18n/pt-BR.json";
import ptBRItems from "@/data/i18n/pt-BR.items.json";
import type { CatalogItem, Lang } from "./types";

interface LocaleBundle {
  ui: Record<string, string>;
  categories: Record<string, string>;
  items: Record<string, string>;
}

const LOCALES: Record<Lang, LocaleBundle> = {
  en: { ui: en.ui, categories: {}, items: {} },
  "pt-BR": { ui: ptBR.ui, categories: ptBRItems.categories, items: ptBRItems.items },
};

export const LANGS: Lang[] = ["pt-BR", "en"];

/**
 * Pick the best interface language from the browser's preferences.
 * Portuguese speakers get pt-BR; everyone else defaults to English.
 */
export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const preferences = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const preference of preferences) {
    if (preference.toLowerCase().startsWith("pt")) return "pt-BR";
    if (preference.toLowerCase().startsWith("en")) return "en";
  }
  return "en";
}

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let text = LOCALES[lang].ui[key] ?? key;
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export function itemName(lang: Lang, item: CatalogItem): string {
  return LOCALES[lang].items[item.id] ?? item.name;
}

export function categoryName(lang: Lang, category: string): string {
  return LOCALES[lang].categories[category] ?? category;
}
