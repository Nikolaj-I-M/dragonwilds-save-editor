"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { levelForXp, SKILLS, xpForLevel } from "@/lib/skills";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  values: Record<string, number>;
  onApply: (values: Record<string, number>) => void;
  onFetch: () => void;
}

export default function SkillsPanel({ lang, values, onApply, onFetch }: Props) {
  const toLevels = (xpValues: Record<string, number>) => Object.fromEntries(
    SKILLS.map((skill) => [skill.id, levelForXp(xpValues[skill.id] ?? 0, skill.maxLevel)]),
  );
  const [draft, setDraft] = useState<Record<string, number>>(() => toLevels(values));
  const [loadedLevels, setLoadedLevels] = useState<Record<string, number>>(() => toLevels(values));

  useEffect(() => {
    const levels = toLevels(values);
    setDraft(levels);
    setLoadedLevels(levels);
  }, [values]);

  return (
    <div className="panel">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-[15px] font-bold tracking-[0.08em] text-gold-bright">
          {t(lang, "skills")}
        </h2>
        <button className="chip ml-auto !py-1 !px-2" onClick={onFetch}>
          ↻ {t(lang, "fetch")}
        </button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-2">{t(lang, "skills_note")}</p>
      <div className="grid grid-cols-2 gap-2">
        {SKILLS.map((skill) => (
          <label key={skill.id} className="text-[12px] text-muted">
            <span className="mb-1 block">{skill.name}</span>
            <input
              type="number"
              min={0}
              step={1}
              className="field w-full text-right"
              max={skill.maxLevel}
              value={draft[skill.id] ?? 1}
              onChange={(event) => setDraft((current) => ({
                ...current,
                [skill.id]: Math.max(1, Math.min(skill.maxLevel, Number(event.target.value) || 1)),
              }))}
            />
          </label>
        ))}
      </div>
      <button className="btn mt-3 w-full" onClick={() => onApply(Object.fromEntries(
        SKILLS
          .filter((skill) => draft[skill.id] !== loadedLevels[skill.id])
          .map((skill) => [skill.id, xpForLevel(draft[skill.id] ?? 1, skill.maxLevel)]),
      ))}>
        {t(lang, "apply_skill_levels")}
      </button>
    </div>
  );
}
