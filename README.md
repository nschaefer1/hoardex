# Hoardex

A desktop inventory management app for **Pathfinder v1** built with Python and PyWebview. Designed to replace the scraps of paper, spreadsheets, and sticky notes your party uses to track gear.

> **Honest note:** I built this as a favor for a friend and I don't have a lot of time to maintain it. If you want to see this grow, please fork it and contribute. I genuinely mean that — the more people who pick this up, the better it gets.

---

## What it does (v1.0)

- **Character management** — stat scores, size category, leg count, icon
- **Inventory tracking** — item library with custom icons (drag & drop PNGs), add/remove/drop items with quantity tracking
- **Encumbrance** — automatic Light/Medium/Heavy band calculation based on STR, size, and leg count, with DM override
- **Currency** — PP/GP/SP/CP wallet with coin weight factored into carry total
- **Weight indicators** — live carry weight display with load status (Light / Medium / Heavy / Over)
- **Search & sort** — alphabetical sorting, real-time search on inventory
- **Icon management** — drag & drop PNG uploads, deduplication by hash, persistent icon library

---

## What it doesn't do yet (good first issues)

This is where I'd start if I had the time. Fork it and go:

- **Sub-inventories** — bags, chests, pouches. Schema is partially in place (`child_ind` on `dim_inventory`, `sub_inv_ck` and `dropped` on `ft_inventory`). Need UI to put items inside containers, a dropped indicator, and weight exclusion when dropped.
- **Currency per container** — `ft_wallet` has `sub_inv_ck` to link currency to a specific bag. Just needs UI.
- **Spells tab** — placeholder tab exists in the UI, not wired up.
- **Abilities tab** — same as above.
- **Notes tab** — same as above.
- **Admin view** — the admin button exists in the sidebar but does nothing. Intended for DM-level overrides (editing any character, bulk item management, etc.).
- **Settings** — the settings button exists but is not wired.
- **Export/Import** — architecture discussion in the codebase. Plan was JSON export with base64-encoded icons so characters and items can be shared between players.
- **Multi-character session** — currently one character is active at a time via session. Could support a party view.
- **Bank** — `ft_wallet` supports a `wallet_name` field. A "Bank" wallet is one SQL row away; just needs UI.
- **Schema migrations** — `db_version` table pattern is documented in the code but not fully implemented. Needed for safe updates.

---

## Tech stack

- **Python** — backend, all business logic
- **PyWebview** — wraps a Chromium browser as a desktop window
- **SQLite** — local database, single `.db` file
- **HTML / CSS / JS** — frontend (vanilla, no framework)

---

## Getting started

### Prerequisites

- Python 3.10+
- pip

### Install

```bash
git clone https://github.com/yourname/hoardex.git
cd hoardex
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
python app.py
```

### Dev seeding

A seed script is included to populate dummy items for development:

```bash
python dev/seed_items.py
```

---

## Building a release

Uses PyInstaller:

```bash
pyinstaller app.py --onefile --windowed --name HoardEx
```

### Version tagging

A PowerShell script is included for bumping versions:

```powershell
.\bump_version.ps1 -Part patch   # 1.0.0 → 1.0.1
.\bump_version.ps1 -Part minor   # 1.0.0 → 1.1.0
.\bump_version.ps1 -Part major   # 1.0.0 → 2.0.0
```

---

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/sub-inventories`)
3. Make your changes
4. Open a pull request

No strict contribution guidelines — just be respectful and write clean code. If you're picking up one of the features listed above, open an issue first so we don't duplicate effort.

---

## License

MIT — do whatever you want with it.

---

## Acknowledgements

Built for a friend who really wanted a better way to track his Pathfinder inventory. 