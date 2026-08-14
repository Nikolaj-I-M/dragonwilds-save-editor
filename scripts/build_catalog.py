#!/usr/bin/env python3
"""Build the canonical catalog and translation files from source data.

Sources:
  * ``legacy/catalogo_itens.json`` — original pt-BR catalog of this project.
  * ``ItemID.json`` — from https://github.com/Elleandria/RS-Dragonwilds-Editor
    (datamined item table: PersistenceID, icon file, weight, power level).

Outputs:
  * ``dragonwilds_editor/data/catalog.json``   — canonical English catalog.
  * ``dragonwilds_editor/data/i18n/pt-BR.json`` — item/category name overrides.

Usage:
  python3 scripts/build_catalog.py <path/to/ItemID.json>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEGACY_CATALOG = ROOT / "legacy" / "python-editor" / "catalogo_itens.json"
OUT_CATALOG = ROOT / "src" / "data" / "catalog.json"
OUT_PTBR = ROOT / "src" / "data" / "i18n" / "pt-BR.items.json"
ICONS_DIR = ROOT / "public" / "assets" / "icons"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)

    item_table = {
        row["PersistenceID"]: row
        for row in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
    }
    legacy = json.loads(LEGACY_CATALOG.read_text(encoding="utf-8"))
    available_icons = {p.name for p in ICONS_DIR.glob("*.png")}

    catalog: list[dict] = []
    item_names_ptbr: dict[str, str] = {}
    category_names_ptbr: dict[str, str] = {}

    for entry in legacy:
        row = item_table.get(entry["id"])
        if row is None:
            print(f"!! sem dados de jogo para {entry['nome_en']}", file=sys.stderr)
            continue

        icon = row.get("IconFile")
        if icon not in available_icons:
            icon = None

        catalog.append(
            {
                "id": entry["id"],
                "name": row["SourceString"],
                "category": row["Category"],
                "icon": icon,
                "emoji": entry["emoji"],  # fallback when the icon is missing
                "max_stack": int(row.get("MaxStackSize") or 1),
                "durability": row.get("BaseDurability"),
                "weight": row.get("Weight"),
                "power_level": row.get("PowerLevel"),
            }
        )

        category_names_ptbr[row["Category"]] = entry["categoria"]
        if entry["nome_ptbr"] != row["SourceString"]:
            item_names_ptbr[entry["id"]] = entry["nome_ptbr"]

    catalog.sort(key=lambda i: (i["category"], i["name"]))

    OUT_CATALOG.write_text(
        json.dumps(catalog, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    OUT_PTBR.write_text(
        json.dumps(
            {
                "categories": dict(sorted(category_names_ptbr.items())),
                "items": dict(sorted(item_names_ptbr.items())),
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"catalogo: {len(catalog)} itens -> {OUT_CATALOG.relative_to(ROOT)}")
    print(f"traducoes: {len(item_names_ptbr)} itens -> {OUT_PTBR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
