# Architecture

The editor is a static **Next.js 16 (App Router)** site (`output: "export"`).
There is no backend: opening, editing and writing the save happen entirely in
the browser.

## Data flow

```
.json file ──▶ pickSaveFile()/drag-drop ──▶ parseSave() ──▶ SaveData (React state)
                                                               │
              immutable mutations (setSlot, setCharName, …) ◀──┤
                                                               ▼
                        serializeSave() ──▶ File System Access API (writes the file)
                                        └─▶ download the .json (fallback)
                                        └─▶ localStorage (session + recents + vault)
```

- **`src/lib/save.ts`** — parse, validation (`GameProgress.Inventory` must be
  present), immutable mutations via `structuredClone`, and serialization in the
  game's own format (TAB indentation + CRLF line endings, byte-for-byte
  compatible with the original file).
- **`src/lib/files.ts`** — open/write. On Chrome/Edge it uses
  `showOpenFilePicker` and writes straight back to the file with write
  permission; other browsers fall back to `<input type=file>` and a Blob
  download.
- **`src/lib/catalog.ts`** — the catalog is imported at build time
  (`src/data/catalog.json`) and indexed by id.
- **`src/lib/i18n.ts`** — UI strings + per-locale name overrides, plus
  `detectLang()` (see below).
- **`src/lib/storage.ts`** — localStorage persistence (below).

## Internationalization

The UI ships in English and Brazilian Portuguese. On first load
`detectLang()` reads `navigator.languages`: Portuguese speakers get `pt-BR`,
everyone else defaults to English. An explicit choice from the language switch
is stored in `dw:lang` and always wins over detection afterwards.

## localStorage

| Key | Contents | Purpose |
| --- | --- | --- |
| `dw:lang` | `"pt-BR"` \| `"en"` | interface language (only when the user picks one) |
| `dw:session` | `{ fileName, charName, text, dirty, savedAt }` | in-progress session, restored automatically on reload (written with a 400 ms debounce on every edit) |
| `dw:recents` | `[{ fileName, charName, text, savedAt }]` (max 5) | recent saves with full content, reopenable in one click from the home screen |
| `dw:vault` | `[{ id, fileName, charName, text, savedAt, origin }]` (max 30) | timestamped backup snapshots (see below) |

Nothing is ever sent outside the browser.

## Backup vault

A snapshot is pushed onto `dw:vault` every time a file is **opened** (the
pristine original) and every time it is **saved**. Consecutive duplicates
(same file, identical content) are skipped so re-saving without changes doesn't
flood the history. The vault holds the 30 most recent snapshots.

The 🗄️ button in the top bar opens the vault, where any snapshot can be
**restored** into the editor, **downloaded** as a `.json`, or **deleted**.
Because it lives in localStorage, it survives reloads but is scoped to the
current browser and profile.

## Components

```
EditorApp (root state: save, language, selections, vault, toasts, tooltip)
├── Embers            # background particle canvas
├── Topbar            # logo, character badge, open/save/backup, vault, language
├── Hero              # empty state: open, drag-and-drop, sample, recents
├── InventoryPanel    # 5 slot sections (SlotButton with icon/count/durability)
├── ItemBrowser       # search + category chips + item grid
├── ItemDetail        # item details, quantity stepper, add/clear
├── CharacterPanel    # character name, health, stamina
├── SaveVault         # modal: restore/download/delete backup snapshots
├── TooltipLayer / Toasts   # global feedback
```

All state lives in `EditorApp` and flows down through props; mutations return a
new `SaveData`, which keeps React predictable and history simple.

## Theme

Color tokens and fonts live in `src/app/globals.css` via `@theme` (Tailwind
v4) — utility classes (`text-gold-bright`, `bg-panel`, …) and component
classes (`.slot`, `.chip`, `.toast`) share the same tokens. Fonts: Cinzel
(headings) and Alegreya Sans (body), served through `next/font`.
