# Catalog and translations

## Files

| File | Role |
| --- | --- |
| `src/data/catalog.json` | Canonical English catalog: 791 items with `id`, `name`, `category`, `icon`, `emoji`, `max_stack`, `durability`, `weight`, `power_level` |
| `src/data/i18n/pt-BR.items.json` | **Generated** — pt-BR item names (only those that differ from English) and the 24 category names |
| `src/data/i18n/pt-BR.json` / `en.json` | Hand-written — interface strings |
| `public/assets/icons/*.png` | 649 item icons extracted from the game (96 px) |

The catalog is imported statically (`src/lib/catalog.ts`), so it is bundled at
build time — no runtime fetch. Items without an icon fall back to their `emoji`.

## Data provenance

- **IDs, icons, weight, power level, categories**: `ItemID.json` datamined from
  the game, from the [Elleandria/RS-Dragonwilds-Editor](https://github.com/Elleandria/RS-Dragonwilds-Editor)
  repository (`PersistenceID` = the save's `ItemData`).
- **pt-BR names**: this project's original catalog
  (`legacy/python-editor/catalogo_itens.json`).
- **Wiki images** (an alternative not used by the site): any item can be
  resolved via
  `https://dragonwilds.runescape.wiki/w/Special:FilePath/<Name_With_Underscores>.png`.

## Regenerating after a game patch

1. Extract/obtain an updated `ItemID.json` (see the Elleandria repo's README).
2. Run:

   ```bash
   python3 scripts/build_catalog.py path/to/ItemID.json
   ```

   The script cross-references both catalogs by id and rewrites
   `src/data/catalog.json` + `src/data/i18n/pt-BR.items.json`, warning about
   items with no data or no icon.
3. Copy any new icons into `public/assets/icons/` (96 px; e.g. `sips -Z 96`).

## Adding a language

1. Create `src/data/i18n/<locale>.json` with a `ui` section (copy `en.json`).
2. (Optional) generate `<locale>.items.json` with `categories`/`items`.
3. Register the locale in `src/lib/i18n.ts` (`LOCALES` and `LANGS`), in
   `src/lib/types.ts` (`Lang`), and add a mapping in `detectLang()` if the
   browser should auto-select it.
