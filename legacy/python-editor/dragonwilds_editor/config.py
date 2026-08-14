"""Static configuration: paths and inventory layout."""

from __future__ import annotations

from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
DATA_DIR = PACKAGE_DIR / "data"
I18N_DIR = DATA_DIR / "i18n"
WEB_DIR = PACKAGE_DIR / "web"

CATALOG_FILE = DATA_DIR / "catalog.json"

#: Where the recent-files list is persisted between runs.
USER_CONFIG_DIR = Path.home() / ".config" / "dragonwilds-save-editor"
RECENTS_FILE = USER_CONFIG_DIR / "recents.json"
MAX_RECENTS = 8

DEFAULT_PORT = 8765

#: Inventory sections: (key, first slot, last slot, columns per row).
#: Slot ranges follow the game's character save layout.
SECTIONS = (
    ("action_bar", 0, 7, 8),
    ("backpack", 8, 31, 8),
    ("runes", 32, 55, 8),
    ("quest", 56, 79, 8),
    ("special", 80, 82, 3),
)
