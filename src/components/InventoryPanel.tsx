"use client";

import { memo } from "react";
import { tipHandlers } from "@/components/Tooltip";
import { CATALOG_BY_ID, iconUrl } from "@/lib/catalog";
import { itemName, t } from "@/lib/i18n";
import type { InventoryEntry, Lang, Section } from "@/lib/types";
import { SECTIONS } from "@/lib/types";

const SECTION_ICONS: Record<Section["key"], string> = {
  action_bar: "/assets/theme/T_Icon_Items_Highlight.png",
  backpack: "/assets/theme/T_Icon_Items_Normal.png",
  runes: "/assets/theme/T_Icon_Runes_Normal.png",
  ammo: "/assets/theme/T_Icon_Items_Normal.png",
  quest: "/assets/theme/T_Icon_Quests_Normal.png",
};

interface Props {
  lang: Lang;
  entries: Record<string, InventoryEntry>;
  selectedSlot: number | null;
  flashSlot: number | null;
  onSelectSlot: (slot: number) => void;
  onCtrlClickBackpackSlot: (slot: number) => void;
}

function SlotButton({
  lang, slot, entry, selected, flash, onSelect, onCtrlClick,
}: {
  lang: Lang;
  slot: number;
  entry: InventoryEntry | undefined;
  selected: boolean;
  flash: boolean;
  onSelect: (slot: number) => void;
  onCtrlClick: (slot: number) => void;
}) {
  const item = entry ? CATALOG_BY_ID.get(entry.ItemData) : undefined;
  const icon = item ? iconUrl(item) : null;

  let tipTitle = `${t(lang, "slot")} ${slot}`;
  let tipSub: string | undefined = t(lang, "empty");
  if (entry) {
    tipTitle = item ? itemName(lang, item) : entry.ItemData;
    const parts: string[] = [];
    if (entry.Count) parts.push(`×${entry.Count}`);
    if (entry.Durability) parts.push(`${t(lang, "durability")}: ${entry.Durability}`);
    tipSub = `${t(lang, "slot")} ${slot}${parts.length ? " • " + parts.join(" • ") : ""}`;
  }

  return (
    <button
      className={`slot ${entry ? "filled" : ""} ${selected ? "selected" : ""} ${flash ? "flash" : ""}`}
      onClick={(event) => {
        if (event.ctrlKey && slot >= 8 && slot <= 31 && entry) {
          onCtrlClick(slot);
          return;
        }
        onSelect(slot);
      }}
      {...tipHandlers(tipTitle, tipSub)}
    >
      <span className="pointer-events-none absolute top-0.5 left-1.5 text-[9.5px] text-muted-2">
        {slot}
      </span>
      {entry && icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          className="pointer-events-none h-[78%] w-[78%] object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.8)]"
        />
      )}
      {entry && !icon && (
        <span className="pointer-events-none text-[22px]">{item ? item.emoji : "❓"}</span>
      )}
      {entry && (entry.Count ?? 0) > 1 && (
        <span className="pointer-events-none absolute right-1 bottom-0.5 rounded-md border border-white/10 bg-black/70 px-1 text-[11px] font-bold text-gold-bright">
          {entry.Count}
        </span>
      )}
      {entry?.Durability && item?.durability && (
        <span className="pointer-events-none absolute right-[8%] bottom-1 left-[8%] h-[3px] overflow-hidden rounded-sm bg-white/10">
          <i
            className="block h-full rounded-sm bg-gradient-to-r from-stamina to-[#c6e26a]"
            style={{ width: `${Math.min(100, (entry.Durability / item.durability) * 100)}%` }}
          />
        </span>
      )}
    </button>
  );
}

function InventoryPanel({
  lang, entries, selectedSlot, flashSlot, onSelectSlot, onCtrlClickBackpackSlot,
}: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-3.5">
      {SECTIONS.map((section, index) => (
        <div
          key={section.key}
          className="panel"
          style={{ animation: `fade-slide-in 0.5s ease ${index * 0.06}s both` }}
        >
          <div className="mb-2.5 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SECTION_ICONS[section.key]}
              alt=""
              className="h-[30px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
            />
            <h2 className="font-display text-[15px] font-bold tracking-[0.1em]">
              {t(lang, `section_${section.key}`)}
            </h2>
            <span className="ml-auto text-[11.5px] tracking-[0.06em] text-muted-2">
              {section.start}–{section.end}
            </span>
          </div>
          <div
            className="grid gap-[7px]"
            style={{ gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: section.end - section.start + 1 }, (_, i) => {
              const slot = section.start + i;
              return (
                <SlotButton
                  key={slot}
                  lang={lang}
                  slot={slot}
                  entry={entries[String(slot)]}
                  selected={selectedSlot === slot}
                  flash={flashSlot === slot}
                  onSelect={onSelectSlot}
                  onCtrlClick={onCtrlClickBackpackSlot}
                />
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export default memo(InventoryPanel);
