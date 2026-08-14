import rawCatalog from "@/data/catalog.json";
import type { CatalogItem } from "./types";

export const CATALOG: CatalogItem[] = rawCatalog as CatalogItem[];

export const CATALOG_BY_ID: Map<string, CatalogItem> = new Map(
  CATALOG.map((item) => [item.id, item]),
);

export const CATEGORIES: string[] = [...new Set(CATALOG.map((item) => item.category))];

export function iconUrl(item: CatalogItem): string | null {
  return item.icon ? `/assets/icons/${item.icon}` : null;
}
