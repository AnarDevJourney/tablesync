# Changelog

All notable changes to `tablesync` and `tablesync-nest`. Versions follow [semver](https://semver.org); while in `0.x`, a minor version may break the API.

## 0.1.0 — unreleased

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
