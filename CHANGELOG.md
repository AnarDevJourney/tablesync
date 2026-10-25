# Changelog

All notable changes to `tablesync` and `tablesync-nest`. Versions follow [semver](https://semver.org); while in `0.x`, a minor version may break the API.

## 0.1.1 — 2026-10-25

### tablesync

- Toolbar: on narrow screens the actions wrap to their own line instead of squeezing the search and filters.
- Docs website with a live demo: [tablesyncpackage.netlify.app](https://tablesyncpackage.netlify.app); `homepage` points to it.

### tablesync-nest

- `homepage` points to the website's backend docs. No code changes.

## 0.1.0 — 2026-10-25

First version, extracted from [MedFlow](https://github.com/AnarDevJourney/medflow-frontend).

### tablesync

- `DataTable`: per-user column order, visibility, width and pins; density; 6 views with live previews; header drag and resize; settings drawer; skeleton, refetch, empty and error states; ⋮ row-actions menu; server-side sort and pagination.
- `TableSyncProvider`: `storage`, `labels`, `onSaveError`, `stickyOffset`. Without one: `localStorage` and English texts.
- Storage adapters: `createLocalStorage`, `createRestStorage` (+ `TableSyncRequestError`).
- Optimistic updates, ordered writes per table, reload after a failed save.
- Theming through `--tablesync-*` CSS variables, falling back to the AntD theme.

### tablesync-nest

- `TableSyncModule.forRoot({ getUserId, path, maxTablesPerUser })`: `GET` / `PATCH` / `DELETE /:tableKey` with validation and per-user isolation.
- `400` answers carry `details: [{ field, errors }]` (validation and duplicate column keys).
- `TableSyncSettings` entity (PostgreSQL), `CreateTablesyncSettings1793300000000` migration, exported `TableSettingsService`.
