# TODO

Roughly prioritized. Top of each section = most impactful.

---

## Bugs

- [ ] Schema migration system — `db_version` table exists but migration runner is not implemented. Required before any schema-breaking update ships.
- [ ] Wallet goes negative — no guard against spending more currency than the character has.
- [ ] Dropped container flag (`dropped` column on `ft_inventory`) exists in schema but is not surfaced in the UI.

---

## Sub-Inventories

The schema is partially in place. `child_ind` flags a container, `sub_inv_ck` on `ft_inventory` binds items to a container, and `dropped` excludes them from weight.

- [ ] UI to place items inside a container (drag & drop proposed)
- [ ] Visual indicator on container items in the main inventory list
- [ ] Red outline / badge on dropped containers to show they're excluded from carry weight
- [ ] Sub-inventory panel — secondary item list scoped to a container, shown when a container is selected
- [ ] Currency per container — `ft_wallet.sub_inv_ck` is in schema, just needs UI
- [ ] Weight calculation to account for dropped containers

---

## Currency

- [ ] Bank wallet — `ft_wallet` supports `wallet_name`, a "Bank" row is one SQL insert away. Needs UI to transfer between On Person and Bank.
- [ ] Find all currency — the magnifying glass button in the sidebar is not wired. Should sum currency across all wallets including sub-inventories.
- [ ] Guard against negative balances on subtract

---

## Tabs (placeholders, not functional)

- [ ] Spells tab
- [ ] Abilities tab  
- [ ] Notes tab

---

## Admin

The admin button exists in the sidebar but is not wired.

- [ ] Admin view — edit any character, bulk item management, DM-level overrides
- [ ] Ability to edit another character's inventory without logging in as them

---

## Settings

The settings button exists but is not wired.

- [ ] Theme toggle (dark/light) persistence
- [ ] Default sort preference
- [ ] App version display

---

## Export / Import

Architecture was discussed but not built.

- [ ] Export character to JSON — item data + base64-encoded icons bundled into a single file
- [ ] Import character from JSON — decode icons, hash-check for deduplication, insert to DB
- [ ] Export item from item library
- [ ] Import item from item library

---

## Polish

- [ ] PyInstaller build script / CI
- [ ] App icon (`.ico`) for the `.exe`
- [ ] Windows SmartScreen — code signing certificate (low priority, expensive)
- [ ] Error boundary — unhandled JS errors should toast instead of silently failing
- [ ] Loading states on initial page load
- [ ] Empty state messaging when inventory is empty
- [ ] Confirm dialog on logout if unsaved pending transactions exist

---

## Nice to have (low priority)

- [ ] Multi-character party view
- [ ] Combat tracker integration
- [ ] Spell slots tracking
- [ ] Condition tracker (Blinded, Paralyzed, etc.)
- [ ] Loot splitting between party members