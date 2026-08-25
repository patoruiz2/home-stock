# inventario-casa

Tracker: **local markdown**. See `.scratch/inventario-casa/` for the wayfinder map.

## Wayfinding operations

- **Map**: `.scratch/inventario-casa/map.md`
- **Child ticket**: `.scratch/inventario-casa/issues/NN-<slug>.md`. `Type:` is `research` / `prototype` / `grilling` / `task`. `Status:` is `open` / `claimed` / `resolved`.
- **Blocking**: `Blocked by: NN, NN` near the top. Unblocked when every listed file is `resolved`.
- **Frontier**: open, unblocked, unclaimed tickets; lowest number first.
- **Claim**: set `Status: claimed` before any work.
- **Resolve**: append `## Answer`, set `Status: resolved`, then add a gist + link on the map's Decisions so far.

Refer to maps and tickets **by name**, not by bare number.
