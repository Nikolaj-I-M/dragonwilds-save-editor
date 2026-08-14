"use client";

import { useEffect, useState } from "react";
import { iconUrl } from "@/lib/catalog";
import { categoryName, itemName, t } from "@/lib/i18n";
import type { CatalogItem, Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  item: CatalogItem | null;
  selectedSlot: number | null;
  canEdit: boolean;
  onAdd: (item: CatalogItem, count: number) => void;
  onClear: () => void;
}

export default function ItemDetail({ lang, item, selectedSlot, canEdit, onAdd, onClear }: Props) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    setCount(item ? item.max_stack : 1);
  }, [item]);

  if (!item) {
    return (
      <div className="panel">
        <p className="my-1 text-center text-[13.5px] italic text-muted-2">
          {t(lang, "select_item_hint")}
        </p>
      </div>
    );
  }

  const icon = iconUrl(item);
  const clamp = (value: number) => Math.max(1, Math.min(value || 1, item.max_stack));
  const stats: [string, string | number][] = [];
  stats.push([t(lang, "stack"), item.max_stack]);
  if (item.durability != null) stats.push([t(lang, "durability"), item.durability]);
  if (item.weight != null) stats.push([t(lang, "weight"), item.weight]);
  if (item.power_level != null) stats.push([t(lang, "power_level"), item.power_level]);

  return (
    <div className="panel" style={{ animation: "fade-slide-in 0.3s ease both" }}>
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-[#0d1220]">
          <div
            className="absolute inset-[10%] rounded-full"
            style={{
              background: "radial-gradient(circle, #c9a22730, transparent 70%)",
              animation: "glow-float 3s ease-in-out infinite",
            }}
          />
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt=""
              className="h-[80%] w-[80%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
              style={{ animation: "icon-float 3.4s ease-in-out infinite" }}
            />
          ) : (
            <span className="text-4xl" style={{ animation: "icon-float 3.4s ease-in-out infinite" }}>
              {item.emoji}
            </span>
          )}
          {item.power_level != null && item.power_level >= 1 && item.power_level <= 4 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/assets/theme/PowerLevel${item.power_level}.png`}
              alt=""
              className="absolute -right-2 -bottom-2 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          )}
        </div>
        <div>
          <h3 className="mb-0.5 font-display text-base leading-tight font-bold text-gold-bright">
            {itemName(lang, item)}
          </h3>
          <span className="text-xs tracking-[0.04em] text-muted">
            {categoryName(lang, item.category)}
          </span>
        </div>
      </div>

      <dl className="my-3 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 rounded-lg border border-line-soft bg-[#0d111c88] px-3 py-2.5 text-[13px]">
        {stats.map(([label, value]) => (
          <div key={label} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-muted-2">{label}</dt>
            <dd className="m-0 text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <label className="mb-1.5 block text-[12.5px] text-muted">{t(lang, "quantity")}</label>
      <div className="flex items-stretch gap-1.5">
        <button
          className="btn w-[34px] !px-0 text-[17px]"
          onClick={() => setCount((c) => clamp(c - 1))}
          aria-label="-"
        >
          −
        </button>
        <input
          type="number"
          className="field w-[72px] text-center"
          min={1}
          max={item.max_stack}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          onBlur={() => setCount((c) => clamp(c))}
        />
        <button
          className="btn w-[34px] !px-0 text-[17px]"
          onClick={() => setCount((c) => clamp(c + 1))}
          aria-label="+"
        >
          +
        </button>
        <button
          className="chip !ml-auto self-center"
          onClick={() => setCount(item.max_stack)}
        >
          {t(lang, "max")} {item.max_stack}
        </button>
      </div>

      <button
        className="btn btn-gold mt-3 w-full"
        disabled={!canEdit || selectedSlot === null}
        onClick={() => onAdd(item, clamp(count))}
      >
        ➕ {selectedSlot !== null
          ? t(lang, "add_to_slot", { slot: selectedSlot })
          : t(lang, "select_slot_hint")}
      </button>
      <button
        className="btn btn-danger mt-2 w-full"
        disabled={!canEdit || selectedSlot === null}
        onClick={onClear}
      >
        🗑️ {t(lang, "clear_slot")}
      </button>
    </div>
  );
}
