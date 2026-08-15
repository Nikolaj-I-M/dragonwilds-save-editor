"use client";

import { memo, useMemo, useState } from "react";
import { tipHandlers } from "@/components/Tooltip";
import { CATALOG, iconUrl } from "@/lib/catalog";
import { categoryName, itemName, t } from "@/lib/i18n";
import { loadFavorites, saveFavorites } from "@/lib/storage";
import type { CatalogItem, Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  selectedItem: CatalogItem | null;
  onSelectItem: (item: CatalogItem) => void;
  onCtrlClickItem: (item: CatalogItem) => void;
}

const FAVORITES = "__favorites__";

function ItemBrowser({ lang, selectedItem, onSelectItem, onCtrlClickItem }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const categories = useMemo(
    () =>
      [...new Set(CATALOG.map((item) => item.category))].sort((a, b) =>
        categoryName(lang, a).localeCompare(categoryName(lang, b)),
      ),
    [lang],
  );

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CATALOG.filter((item) => {
      if (category === FAVORITES && !favoriteSet.has(item.id)) return false;
      if (category && category !== FAVORITES && item.category !== category) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        itemName(lang, item).toLowerCase().includes(query) ||
        categoryName(lang, item.category).toLowerCase().includes(query)
      );
    });
  }, [search, category, favoriteSet, lang]);

  const toggleFavorite = (itemId: string) => {
    const next = favoriteSet.has(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];
    setFavorites(next);
    saveFavorites(next);
  };

  return (
    <div className="panel flex flex-col">
      <div className="-mt-1 mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/theme/T_Icon_Items_Normal.png"
          alt=""
          className="h-10 opacity-90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="search"
          className="field flex-1"
          placeholder={t(lang, "search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-[11.5px] whitespace-nowrap text-muted-2">
          {t(lang, "items_count", { n: items.length })}
        </span>
      </div>

      <div className="my-2.5 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
        <button
          className={`chip ${category === null ? "active" : ""}`}
          onClick={() => setCategory(null)}
        >
          {t(lang, "all_categories")}
        </button>
        <button
          className={`chip ${category === FAVORITES ? "active" : ""}`}
          onClick={() => setCategory(category === FAVORITES ? null : FAVORITES)}
        >
          ★ {t(lang, "favorites")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(category === cat ? null : cat)}
          >
            {categoryName(lang, cat)}
          </button>
        ))}
      </div>

      <div
        className="grid max-h-[336px] gap-1.5 overflow-y-auto p-0.5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
          scrollbarWidth: "thin",
        }}
        role="listbox"
      >
        {items.map((item, index) => {
          const icon = iconUrl(item);
          return (
            <div key={item.id} className="relative" style={index < 40 ? { animationDelay: `${index * 12}ms` } : { animation: "none" }}>
              <button
                role="option"
                aria-selected={selectedItem?.id === item.id}
                className={`item-cell w-full ${selectedItem?.id === item.id ? "active" : ""}`}
                onClick={(event) => {
                  onSelectItem(item);
                  if (event.ctrlKey) onCtrlClickItem(item);
                }}
                {...tipHandlers(itemName(lang, item), categoryName(lang, item.category))}
              >
                {icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={icon}
                    alt=""
                    loading="lazy"
                    className="pointer-events-none h-[80%] w-[80%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]"
                  />
                ) : (
                  <span className="pointer-events-none text-xl">{item.emoji}</span>
                )}
              </button>
              <button
                className={`favorite-toggle ${favoriteSet.has(item.id) ? "active" : ""}`}
                onClick={() => toggleFavorite(item.id)}
                aria-label={favoriteSet.has(item.id) ? t(lang, "remove_favorite") : t(lang, "add_favorite")}
                title={favoriteSet.has(item.id) ? t(lang, "remove_favorite") : t(lang, "add_favorite")}
              >
                ★
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ItemBrowser);
