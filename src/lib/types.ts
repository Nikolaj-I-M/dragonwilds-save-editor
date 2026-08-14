/** Item do catálogo canônico (src/data/catalog.json). */
export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  emoji: string;
  max_stack: number;
  durability: number | null;
  weight: number | null;
  power_level: number | null;
}

/** Entrada de um slot no inventário do save. */
export interface InventoryEntry {
  GUID: string;
  ItemData: string;
  Count?: number;
  Durability?: number;
}

/** Documento do save do personagem (estrutura parcial — o resto é preservado). */
export interface SaveData {
  meta_data?: { char_name?: string; [key: string]: unknown };
  GameProgress: {
    Inventory: { MaxSlotIndex?: number; [slot: string]: InventoryEntry | number | undefined };
    Character?: {
      Health?: { CurrentValue?: number; [key: string]: unknown };
      Stamina?: { CurrentValue?: number; [key: string]: unknown };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Seção do inventário, espelhando o layout do jogo. */
export interface Section {
  key: "action_bar" | "backpack" | "runes" | "ammo" | "quest";
  start: number;
  end: number;
  columns: number;
}

export const SECTIONS: Section[] = [
  { key: "action_bar", start: 0, end: 7, columns: 8 },
  { key: "backpack", start: 8, end: 31, columns: 8 },
  { key: "runes", start: 32, end: 55, columns: 8 },
  { key: "ammo", start: 56, end: 79, columns: 8 },
  { key: "quest", start: 80, end: 103, columns: 8 },
];

export type Lang = "pt-BR" | "en";
