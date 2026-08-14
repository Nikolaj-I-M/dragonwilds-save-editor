# Character save format

The save is a `.json` file (UTF-8, TAB-indented, CRLF line endings) located at
`%LocalAppData%\RSDragonwilds\Saved\SaveCharacters\` on Windows. The editor
preserves every field it doesn't understand — it only touches what you edit.

## Relevant structure

```jsonc
{
  "meta_data": {
    "char_name": "Adventurer"          // character name (editable)
  },
  "GameProgress": {
    "Inventory": {
      "MaxSlotIndex": 33,              // highest occupied slot (kept in sync)
      "0": {                           // slots are numeric string keys
        "GUID": "sv9htI6NV3DFoX5jmzqVUg",     // unique instance id (base64url, 22 chars)
        "ItemData": "P3_Aq0nAXu5dlFuBNGgyaw", // catalog item id
        "Durability": 1300             // non-stackable items with durability
      },
      "1": {
        "GUID": "…",
        "ItemData": "Dvo6TE2d7YNnoni8XbKYzw",
        "Count": 250                   // stackable items
      }
    },
    "Character": {
      "Health":  { "CurrentValue": 100.0 },
      "Stamina": { "CurrentValue": 100.0 }
    }
  }
}
```

## Slot layout

| Range | Section |
| --- | --- |
| 0–7 | Action Bar |
| 8–31 | Backpack |
| 32–55 | Runes |
| 56–79 | Quest |
| 80–82 | Special |

## Rules the editor applies

- Placing an item generates a **fresh GUID** (avoids "ghost" items caused by
  duplicate instances).
- Items with `max_stack > 1` get a `Count` (clamped to the max stack); unique
  items with durability get full `Durability`.
- `MaxSlotIndex` is bumped if the edited slot exceeds the current value.
- The minimum health written is 1; values above the character's maximum are
  clamped by the game itself on load.
- Always edit with the **game closed** — it overwrites the file on save.
