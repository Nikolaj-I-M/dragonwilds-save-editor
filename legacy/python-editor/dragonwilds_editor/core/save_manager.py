"""Reading, editing and writing the character save file (.json)."""

from __future__ import annotations

import base64
import json
import os
import shutil
from pathlib import Path
from typing import Optional

from .catalog import CatalogItem


def new_instance_guid() -> str:
    """GUID in the game's instance format (base64url, 22 chars)."""
    return base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip("=")


class InvalidSaveError(ValueError):
    """The file does not look like a Dragonwilds character save."""


class SaveManager:
    """Owns the loaded save document and every mutation applied to it."""

    def __init__(self) -> None:
        self.path: Optional[Path] = None
        self._data: Optional[dict] = None
        self.dirty = False

    # ---- I/O ---------------------------------------------------------------

    def open(self, path: Path) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))
        if "GameProgress" not in data or "Inventory" not in data["GameProgress"]:
            raise InvalidSaveError(
                "O arquivo não parece ser um save de personagem válido."
            )
        self.path = path
        self._data = data
        self.dirty = False

    def write(self) -> Path:
        """Write the save (creating a .bak backup first); returns backup path."""
        assert self.path is not None and self._data is not None
        backup = self.path.with_suffix(self.path.suffix + ".bak")
        if self.path.exists():
            shutil.copy2(self.path, backup)
        text = json.dumps(self._data, indent="\t", ensure_ascii=False)
        self.path.write_text(text, encoding="utf-8", newline="\r\n")
        self.dirty = False
        return backup

    # ---- Inventory -----------------------------------------------------------

    @property
    def loaded(self) -> bool:
        return self._data is not None

    @property
    def _inventory(self) -> dict:
        assert self._data is not None
        return self._data["GameProgress"]["Inventory"]

    @property
    def character_name(self) -> str:
        assert self._data is not None
        return self._data.get("meta_data", {}).get("char_name", "?")

    def inventory_entries(self) -> dict[str, dict]:
        """Slot number (as str) -> raw item entry, for every occupied slot."""
        return {
            slot: entry
            for slot, entry in self._inventory.items()
            if slot.isdigit() and isinstance(entry, dict)
        }

    def set_slot(self, slot: int, item: CatalogItem, count: int) -> None:
        """Place `count` of `item` in the slot, replacing its contents."""
        entry: dict = {"GUID": new_instance_guid(), "ItemData": item.id}
        if item.max_stack > 1:
            entry["Count"] = max(1, min(count, item.max_stack))
        elif item.durability:
            entry["Durability"] = item.durability
        self._inventory[str(slot)] = entry
        if slot > self._inventory.get("MaxSlotIndex", -1):
            self._inventory["MaxSlotIndex"] = slot
        self.dirty = True

    def clear_slot(self, slot: int) -> None:
        if self._inventory.pop(str(slot), None) is not None:
            self.dirty = True

    # ---- Character attributes --------------------------------------------------

    def _attribute(self, name: str) -> dict:
        assert self._data is not None
        character = self._data["GameProgress"].setdefault("Character", {})
        return character.setdefault(name, {"CurrentValue": 0})

    def get_health(self) -> float:
        return self._attribute("Health").get("CurrentValue", 0)

    def get_stamina(self) -> float:
        return self._attribute("Stamina").get("CurrentValue", 0)

    def set_health(self, value: float) -> None:
        self._attribute("Health")["CurrentValue"] = max(1, value)
        self.dirty = True

    def set_stamina(self, value: float) -> None:
        self._attribute("Stamina")["CurrentValue"] = max(0, value)
        self.dirty = True

    # ---- State snapshot ---------------------------------------------------------

    def state(self) -> dict:
        """Full state in the shape the web client consumes."""
        if not self.loaded:
            return {"loaded": False}
        return {
            "loaded": True,
            "path": str(self.path),
            "file_name": self.path.name if self.path else "",
            "character_name": self.character_name,
            "inventory": self.inventory_entries(),
            "health": self.get_health(),
            "stamina": self.get_stamina(),
            "dirty": self.dirty,
        }
