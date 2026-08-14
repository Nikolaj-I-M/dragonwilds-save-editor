"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  charName: string;
  health: number;
  stamina: number;
  onApply: (changes: { name: string; health: number; stamina: number }) => void;
}

/** Escala ilustrativa das barras (atributos do jogo ficam tipicamente em 0–200). */
const BAR_SCALE = 200;

export default function CharacterPanel({ lang, charName, health, stamina, onApply }: Props) {
  const [name, setName] = useState(charName);
  const [healthValue, setHealthValue] = useState(Math.round(health));
  const [staminaValue, setStaminaValue] = useState(Math.round(stamina));

  useEffect(() => setName(charName), [charName]);
  useEffect(() => setHealthValue(Math.round(health)), [health]);
  useEffect(() => setStaminaValue(Math.round(stamina)), [stamina]);

  return (
    <div className="panel">
      <h2 className="mb-3 font-display text-[15px] font-bold tracking-[0.08em] text-gold-bright">
        🐉 {t(lang, "character")}
      </h2>

      <label className="mb-1.5 block text-[12.5px] text-muted">{t(lang, "char_name")}</label>
      <input
        type="text"
        className="field mb-3 w-full font-display font-bold text-gold-bright"
        value={name}
        maxLength={32}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mt-2 flex items-center justify-between gap-2.5">
        <span className="text-sm font-semibold text-health">❤ {t(lang, "health")}</span>
        <input
          type="number"
          className="field w-[110px] text-right"
          min={1}
          value={healthValue}
          onChange={(e) => setHealthValue(Number(e.target.value))}
        />
      </div>
      <div className="mt-1.5 mb-0.5 h-1.5 overflow-hidden rounded-[3px] bg-white/5">
        <div
          className="attr-fill bg-gradient-to-r from-[#7e2b2b] to-health shadow-[0_0_8px_#d24d4d66]"
          style={{ width: `${Math.min(100, (healthValue / BAR_SCALE) * 100)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2.5">
        <span className="text-sm font-semibold text-stamina">⚡ {t(lang, "stamina")}</span>
        <input
          type="number"
          className="field w-[110px] text-right"
          min={0}
          value={staminaValue}
          onChange={(e) => setStaminaValue(Number(e.target.value))}
        />
      </div>
      <div className="mt-1.5 mb-0.5 h-1.5 overflow-hidden rounded-[3px] bg-white/5">
        <div
          className="attr-fill bg-gradient-to-r from-[#4d6b28] to-stamina shadow-[0_0_8px_#8fbf4d66]"
          style={{ width: `${Math.min(100, (staminaValue / BAR_SCALE) * 100)}%` }}
        />
      </div>

      <button
        className="btn mt-3 w-full"
        onClick={() =>
          onApply({
            name: name.trim() || charName,
            health: healthValue,
            stamina: staminaValue,
          })
        }
      >
        ✅ {t(lang, "apply")}
      </button>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-2">
        ℹ️ {t(lang, "attributes_note")}
      </p>
    </div>
  );
}
