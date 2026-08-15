/**
 * Leitura, mutação e serialização do save do personagem.
 *
 * Todas as mutações são imutáveis (via structuredClone) para funcionar bem
 * com o estado do React. A serialização replica o formato do jogo:
 * indentação com TAB e quebras de linha CRLF.
 */

import type { CatalogItem, InventoryEntry, SaveData } from "./types";

export class InvalidSaveError extends Error {}

/** GUID de instância no formato do jogo (base64url, 22 chars). */
export function newInstanceGuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function parseSave(text: string): SaveData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new InvalidSaveError("invalid json");
  }
  const doc = data as SaveData;
  if (typeof doc !== "object" || doc === null || !doc.GameProgress?.Inventory) {
    throw new InvalidSaveError("missing GameProgress.Inventory");
  }
  return doc;
}

/** Serializa no formato do jogo (TAB + CRLF). */
export function serializeSave(data: SaveData): string {
  return JSON.stringify(data, null, "\t").replaceAll("\n", "\r\n");
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export function getCharName(data: SaveData): string {
  return data.meta_data?.char_name ?? "?";
}

export function getInventoryEntries(data: SaveData): Record<string, InventoryEntry> {
  const entries: Record<string, InventoryEntry> = {};
  for (const [key, value] of Object.entries(data.GameProgress.Inventory)) {
    if (/^\d+$/.test(key) && typeof value === "object" && value !== null) {
      entries[key] = value as InventoryEntry;
    }
  }
  return entries;
}

export function getHealth(data: SaveData): number {
  return data.GameProgress.Character?.Health?.CurrentValue ?? 0;
}

export function getStamina(data: SaveData): number {
  return data.GameProgress.Character?.Stamina?.CurrentValue ?? 0;
}

export function getSustenance(data: SaveData): number {
  return (data.GameProgress.Character?.Sustenance as { SustenanceValue?: number } | undefined)?.SustenanceValue ?? 0;
}

export function getHydration(data: SaveData): number {
  return (data.GameProgress.Character?.Hydration as { HydrationValue?: number } | undefined)?.HydrationValue ?? 0;
}

export function getEndurance(data: SaveData): number {
  return (data.GameProgress.Character?.Endurance as { EnduranceValue?: number } | undefined)?.EnduranceValue ?? 0;
}

/** Returns the skill XP values stored by current Dragonwilds saves. */
export function getSkillXp(data: SaveData): Record<string, number> {
  const skillsContainer = data.GameProgress.Skills as { Skills?: unknown } | undefined;
  const result: Record<string, number> = {};
  if (!Array.isArray(skillsContainer?.Skills)) return result;

  for (const rawSkill of skillsContainer.Skills) {
    if (!rawSkill || typeof rawSkill !== "object") continue;
    const skill = rawSkill as { Id?: unknown; Xp?: unknown };
    if (typeof skill.Id !== "string" || !Number.isFinite(Number(skill.Xp))) continue;
    result[skill.Id] = Math.max(0, Math.floor(Number(skill.Xp)));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Mutação (imutável: retorna um novo documento)
// ---------------------------------------------------------------------------

export function setCharName(data: SaveData, name: string): SaveData {
  const next = structuredClone(data);
  next.meta_data = { ...(next.meta_data ?? {}), char_name: name };
  return next;
}

export function setSlot(
  data: SaveData,
  slot: number,
  item: CatalogItem,
  count: number,
): SaveData {
  const next = structuredClone(data);
  const entry: InventoryEntry = { GUID: newInstanceGuid(), ItemData: item.id };
  if (item.max_stack > 1) {
    entry.Count = Math.max(1, Math.min(count, item.max_stack));
  } else if (item.durability) {
    entry.Durability = item.durability;
  }
  const inventory = next.GameProgress.Inventory;
  inventory[String(slot)] = entry;
  if (slot > (inventory.MaxSlotIndex ?? -1)) inventory.MaxSlotIndex = slot;
  return next;
}

export function clearSlot(data: SaveData, slot: number): SaveData {
  const next = structuredClone(data);
  delete next.GameProgress.Inventory[String(slot)];
  return next;
}

function setAttribute(data: SaveData, attribute: "Health" | "Stamina", value: number): SaveData {
  const next = structuredClone(data);
  const character = (next.GameProgress.Character ??= {});
  const record = (character[attribute] ??= { CurrentValue: 0 }) as { CurrentValue?: number };
  record.CurrentValue = value;
  return next;
}

export function setHealth(data: SaveData, value: number): SaveData {
  return setAttribute(data, "Health", Math.max(1, value));
}

export function setStamina(data: SaveData, value: number): SaveData {
  return setAttribute(data, "Stamina", Math.max(0, value));
}

function setSurvivalValue(
  data: SaveData,
  attribute: "Sustenance" | "Hydration" | "Endurance",
  value: number,
): SaveData {
  const next = structuredClone(data);
  const character = (next.GameProgress.Character ??= {});
  const key = `${attribute}Value`;
  const record = (character[attribute] ??= {}) as Record<string, number>;
  record[key] = Math.max(0, Math.min(100, value));
  return next;
}

export function setSustenance(data: SaveData, value: number): SaveData {
  return setSurvivalValue(data, "Sustenance", value);
}

export function setHydration(data: SaveData, value: number): SaveData {
  return setSurvivalValue(data, "Hydration", value);
}

export function setEndurance(data: SaveData, value: number): SaveData {
  return setSurvivalValue(data, "Endurance", value);
}

/** Updates XP only. Dragonwilds calculates the displayed level itself when loading. */
export function setSkillXp(data: SaveData, values: Record<string, number>): SaveData {
  const next = structuredClone(data);
  const progress = next.GameProgress as Record<string, unknown>;
  const skillsContainer = (progress.Skills ??= {}) as { Skills?: unknown };
  const skills = Array.isArray(skillsContainer.Skills)
    ? skillsContainer.Skills as Array<Record<string, unknown>>
    : (skillsContainer.Skills = [] as Array<Record<string, unknown>>);

  for (const [id, xp] of Object.entries(values)) {
    const cleanXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
    const existing = skills.find((skill) => skill.Id === id);
    if (existing) existing.Xp = cleanXp;
    else skills.push({ Id: id, Xp: cleanXp });
  }
  return next;
}
