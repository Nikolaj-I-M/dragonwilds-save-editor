"""Item catalog: canonical English data plus per-locale name overrides."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .. import config


@dataclass(frozen=True)
class CatalogItem:
    """A known game item, as shipped in ``data/catalog.json``."""

    id: str
    name: str
    category: str
    icon: Optional[str]
    emoji: str
    max_stack: int
    durability: Optional[int]
    weight: Optional[float]
    power_level: Optional[int]


class Catalog:
    """Loads and indexes the item catalog and its translations."""

    def __init__(
        self,
        catalog_file: Path = config.CATALOG_FILE,
        i18n_dir: Path = config.I18N_DIR,
    ) -> None:
        raw = json.loads(catalog_file.read_text(encoding="utf-8"))
        self.items: list[CatalogItem] = [CatalogItem(**entry) for entry in raw]
        self.by_id: dict[str, CatalogItem] = {item.id: item for item in self.items}
        self.locales: dict[str, dict] = self._load_locales(i18n_dir)

    @staticmethod
    def _load_locales(i18n_dir: Path) -> dict[str, dict]:
        """Merge UI strings (``<locale>.json``) with generated item/category
        name overrides (``<locale>.items.json``) into one bundle per locale."""
        locales: dict[str, dict] = {}
        for path in sorted(i18n_dir.glob("*.json")):
            locale = path.stem.removesuffix(".items")
            bundle = locales.setdefault(
                locale, {"ui": {}, "categories": {}, "items": {}}
            )
            data = json.loads(path.read_text(encoding="utf-8"))
            for section in ("ui", "categories", "items"):
                bundle[section].update(data.get(section, {}))
        return locales

    def as_payload(self) -> dict:
        """Catalog + translations in the shape the web client consumes."""
        return {
            "items": [item.__dict__ for item in self.items],
            "locales": self.locales,
        }
