/**
 * localStorage persistence:
 *  - `dw:lang`     interface language (explicit user choice)
 *  - `dw:session`  in-progress session (serialized save + metadata),
 *                  restored automatically on page reload
 *  - `dw:recents`  last opened saves (with content), to reopen in one click
 *  - `dw:vault`    timestamped backup snapshots taken on every open/save,
 *                  so a previous version can always be restored
 *  - `dw:favorites` item IDs starred in the item browser
 */

import type { Lang } from "./types";

const KEY_LANG = "dw:lang";
const KEY_SESSION = "dw:session";
const KEY_RECENTS = "dw:recents";
const KEY_VAULT = "dw:vault";
const KEY_FAVORITES = "dw:favorites";
const MAX_RECENTS = 5;
const MAX_VAULT = 30;

export interface StoredSession {
  fileName: string;
  charName: string;
  text: string;
  dirty: boolean;
  savedAt: number;
}

export interface RecentSave {
  fileName: string;
  charName: string;
  text: string;
  savedAt: number;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage cheio ou indisponível — persistência é opcional.
  }
}

// ---- Idioma -----------------------------------------------------------------

export function loadLang(): Lang | null {
  return read<Lang>(KEY_LANG);
}

export function saveLang(lang: Lang): void {
  write(KEY_LANG, lang);
}

// ---- Sessão em andamento ------------------------------------------------------

export function loadSession(): StoredSession | null {
  return read<StoredSession>(KEY_SESSION);
}

export function saveSession(session: StoredSession): void {
  write(KEY_SESSION, session);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY_SESSION);
  } catch {
    /* ignore */
  }
}

// ---- Recentes -------------------------------------------------------------------

export function loadRecents(): RecentSave[] {
  return read<RecentSave[]>(KEY_RECENTS) ?? [];
}

export function rememberRecent(entry: RecentSave): void {
  const others = loadRecents().filter((r) => r.fileName !== entry.fileName);
  write(KEY_RECENTS, [entry, ...others].slice(0, MAX_RECENTS));
}

// ---- Backup vault -------------------------------------------------------------

/** How a snapshot came to exist. */
export type VaultOrigin = "opened" | "saved";

export interface VaultEntry {
  id: string;
  fileName: string;
  charName: string;
  text: string;
  savedAt: number;
  origin: VaultOrigin;
}

export function loadVault(): VaultEntry[] {
  return read<VaultEntry[]>(KEY_VAULT) ?? [];
}

/**
 * Store a snapshot at the top of the vault. Consecutive duplicates (same file
 * with identical content) are skipped so re-saving without changes doesn't
 * flood the history. Returns the created entry, or null if it was a duplicate.
 */
export function pushVaultEntry(entry: Omit<VaultEntry, "id">): VaultEntry | null {
  const vault = loadVault();
  const newest = vault[0];
  if (newest && newest.fileName === entry.fileName && newest.text === entry.text) {
    return null;
  }
  const created: VaultEntry = { ...entry, id: crypto.randomUUID() };
  write(KEY_VAULT, [created, ...vault].slice(0, MAX_VAULT));
  return created;
}

export function deleteVaultEntry(id: string): void {
  write(KEY_VAULT, loadVault().filter((e) => e.id !== id));
}

export function clearVault(): void {
  try {
    localStorage.removeItem(KEY_VAULT);
  } catch {
    /* ignore */
  }
}

// ---- Favoritos ----------------------------------------------------------------

export function loadFavorites(): string[] {
  return read<string[]>(KEY_FAVORITES) ?? [];
}

export function saveFavorites(itemIds: string[]): void {
  write(KEY_FAVORITES, [...new Set(itemIds)]);
}
