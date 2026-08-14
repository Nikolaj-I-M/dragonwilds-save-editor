# 🐉 Dragonwilds Save Editor

A free, open-source **save editor for RuneScape: Dragonwilds**, built with
**Next.js**. Everything runs in your browser — your character file never leaves
your machine.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![React 19](https://img.shields.io/badge/React-19-61dafb) ![100%25 client-side](https://img.shields.io/badge/data-100%25%20local-2ea44f) ![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- 🎒 **Full inventory** by section, just like the game: Action Bar (0–7),
  Backpack (8–31), Runes (32–55), Quest (56–79) and Special (80–82)
- 🗡️ **791-item catalog** with real in-game icons, search and category filters
- ✏️ **Edit the character name**, health and stamina
- 💾 **Write straight to the file** (File System Access API on Chrome/Edge) or
  download the edited `.json`, with a backup of the original always available
- 🗄️ **Backup history** — every open and save is snapshotted into localStorage
  so you can restore, download or delete any previous version
- 🌐 **English and Portuguese** UI that follows your browser language
  automatically, with a manual switch
- ✨ Dark-fantasy theme with animations (embers, glow, tooltips, toasts)

## Live use

The site is a static export — deploy it anywhere (Vercel, GitHub Pages, Netlify,
nginx…). To run your own copy on Vercel, import this repository; no environment
variables or backend are required.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

To build the static site:

```bash
npm run build      # outputs to ./out
```

### Editing a save

1. Open the character's `.json` (the **Open Save** button or drag the file in).
2. Select an inventory slot, pick an item from the catalog and add it.
3. Adjust the name, health and stamina in the **Character** panel.
4. **Save**: on Chrome/Edge it writes straight back to the original file; other
   browsers download the edited `.json` for you to replace manually.

> ⚠️ Edit the save **only while the game is closed**. Character saves live in
> `%LocalAppData%\RSDragonwilds\Saved\SaveCharacters\` (Windows).

## Documentation

| Document | Contents |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | App structure, data flow, i18n, localStorage keys, backup vault |
| [docs/save-format.md](docs/save-format.md) | The character `.json` format and slot layout |
| [docs/catalog-and-translations.md](docs/catalog-and-translations.md) | Catalog pipeline, translations, regenerating the data |

## Project structure

```
├── src/
│   ├── app/                  # App Router (layout, page, global theme)
│   ├── components/           # UI (EditorApp, Inventory, Browser, Character, Vault…)
│   ├── lib/                  # pure logic: save, catalog, i18n, storage, files
│   └── data/                 # catalog.json (EN) + i18n/ (pt-BR, en)
├── public/
│   ├── assets/icons/         # 649 item icons extracted from the game
│   ├── assets/theme/         # UI art (power levels, tabs, dragon)
│   └── examples/             # sample save for trying it out
├── scripts/build_catalog.py  # regenerates the catalog + translations
├── docs/                     # documentation
└── legacy/python-editor/     # previous versions (tkinter and Python + web)
```

## Contributing

Contributions are welcome. To add or fix item data, see
[docs/catalog-and-translations.md](docs/catalog-and-translations.md); to add a
language, follow the "Adding a language" section there. Please run
`npx tsc --noEmit` and `npm run build` before opening a pull request.

## Credits

- Icons and datamined item table: [Elleandria/RS-Dragonwilds-Editor](https://github.com/Elleandria/RS-Dragonwilds-Editor)
- Game information: [Dragonwilds Wiki](https://dragonwilds.runescape.wiki/)

## License

[MIT](LICENSE) © Dário Jr

Not affiliated with Jagex. RuneScape: Dragonwilds and all related assets are
property of Jagex Ltd.
