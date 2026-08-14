# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this is

A **client-side save editor for RuneScape: Dragonwilds**, built as a static
Next.js 16 site (`output: "export"`). There is **no backend** — parsing,
editing and writing the save all happen in the browser. It is deployed as a
static site (e.g. Vercel).

## Commands

```bash
npm run dev            # dev server on :3000
npm run build          # static export to ./out
npx tsc --noEmit       # type-check (run before committing)
```

There is no test suite yet; verify changes by running the app and exercising
the flow (open a save, edit, save). A sample save lives at
`public/examples/sample_character.json`.

## Layout

- `src/lib/` — framework-free logic. Keep it pure and unit-testable.
  - `save.ts` — parse/validate/mutate/serialize. Mutations are **immutable**
    (`structuredClone`) and serialization must stay byte-compatible with the
    game: TAB indentation + CRLF line endings.
  - `files.ts` — File System Access API with a download fallback.
  - `storage.ts` — localStorage: `dw:lang`, `dw:session`, `dw:recents`,
    `dw:vault`.
  - `i18n.ts` — UI strings + `detectLang()` (browser-language detection).
  - `catalog.ts` — the static item catalog, indexed by id.
- `src/components/` — React (client components). `EditorApp.tsx` owns all state
  and passes it down; child components are presentational.
- `src/data/` — `catalog.json` (canonical English) and `i18n/` translations.
- `public/assets/` — game icons and theme art.
- `scripts/build_catalog.py` — regenerates the catalog/translations from a
  datamined `ItemID.json`.
- `legacy/` — earlier Python versions; not part of the build (excluded in
  `tsconfig.json`). Don't touch unless asked.

## Conventions

- **TypeScript strict**; keep `npx tsc --noEmit` clean.
- **Styling**: Tailwind v4 with design tokens in `src/app/globals.css`
  (`@theme`). Reuse the existing tokens and component classes (`.panel`,
  `.slot`, `.chip`, `.btn`, …) instead of hardcoding colors.
- **i18n**: every user-facing string goes through `t(lang, key)`. When you add a
  UI string, add it to **both** `src/data/i18n/en.json` and `pt-BR.json`. The UI
  is bilingual (English default, Portuguese auto-selected for pt browsers).
- **Privacy is a feature**: never add network calls that send save data
  anywhere. The app must keep working fully offline.
- Documentation (README, `docs/`, this file) is written in **English**.

## Data regeneration

After a game patch, update the catalog with:

```bash
python3 scripts/build_catalog.py path/to/ItemID.json
```

See `docs/catalog-and-translations.md` for the full pipeline.
