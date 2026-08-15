export interface SkillDefinition {
  id: string;
  name: string;
  maxLevel: number;
}

/** Canonical skill data assets used by Dragonwilds save files. */
export const SKILLS: SkillDefinition[] = [
  { id: "Wf3i7Ha-B06DH719j1vtBw", name: "Artisan", maxLevel: 99 },
  { id: "4pefO9k1lUqfA6mvHNi1SA", name: "Attack", maxLevel: 99 },
  { id: "waK-8EyQFQ2xEjCGYmuTRQ", name: "Construction", maxLevel: 99 },
  { id: "Tn7t6DQyX0-Q0cM5K7B90A", name: "Cooking", maxLevel: 99 },
  { id: "PyUi-0LU_riFY46AnnFiWg", name: "Farming", maxLevel: 99 },
  { id: "vwY5IkQJJDwb2PKEfoc8MQ", name: "Fishing", maxLevel: 99 },
  { id: "0hreSMRVXUihq9qjDO2CFA", name: "Magic", maxLevel: 99 },
  { id: "jqX0Gh6QI0GFFPCDFK_CJQ", name: "Mining", maxLevel: 99 },
  { id: "heq7u88Q2UuLXFqLGTVwQw", name: "Ranged", maxLevel: 99 },
  { id: "NOqC-z-2ckqi0El22qMFlw", name: "Runecrafting", maxLevel: 99 },
  { id: "4zYUGF5u_0KbMLkWJmmBbQ", name: "Woodcutting", maxLevel: 99 },
  { id: "pJggvotwOkuoc98igUn7xA", name: "Agility", maxLevel: 99 },
];

// Dragonwilds uses RuneScape's standard cumulative XP curve.
const XP_AT_LEVEL = Array.from({ length: 100 }, (_, index) => {
  const level = index + 1;
  if (level <= 1) return 0;
  let points = 0;
  for (let current = 1; current < level; current += 1) {
    points += Math.floor(current + 300 * 2 ** (current / 7));
  }
  return Math.floor(points / 4);
});

export function levelForXp(xp: number, maxLevel = 99): number {
  const cleanXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < maxLevel && cleanXp >= XP_AT_LEVEL[level]) level += 1;
  return level;
}

export function xpForLevel(level: number, maxLevel = 99): number {
  const cleanLevel = Math.max(1, Math.min(maxLevel, Math.floor(level)));
  return XP_AT_LEVEL[cleanLevel - 1];
}
