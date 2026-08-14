"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const SKILLS = [
  "Agility", "Artisan", "Attack", "Construction", "Cooking", "Farming",
  "Magic", "Mining", "Ranged", "Runecrafting", "Woodcutting",
];

interface Props {
  lang: Lang;
  values: Record<string, number>;
  onApply: (values: Record<string, number>) => void;
}

export default function SkillsPanel({ lang, values, onApply }: Props) {
  const [draft, setDraft] = useState<Record<string, number>>(values);

  useEffect(() => setDraft(values), [values]);

  return (
    <div className="panel">
      <h2 className="mb-1 font-display text-[15px] font-bold tracking-[0.08em] text-gold-bright">
        {t(lang, "skills")}
      </h2>
      <p className="mb-3 text-xs leading-relaxed text-muted-2">{t(lang, "skills_note")}</p>
      <div className="grid grid-cols-2 gap-2">
        {SKILLS.map((skill) => (
          <label key={skill} className="text-[12px] text-muted">
            <span className="mb-1 block">{skill}</span>
            <input
              type="number"
              min={0}
              step={1}
              className="field w-full text-right"
              value={draft[skill] ?? 0}
              onChange={(event) => setDraft((current) => ({
                ...current,
                [skill]: Math.max(0, Number(event.target.value) || 0),
              }))}
            />
          </label>
        ))}
      </div>
      <button className="btn mt-3 w-full" onClick={() => onApply(draft)}>
        {t(lang, "apply_skill_xp")}
      </button>
    </div>
  );
}
