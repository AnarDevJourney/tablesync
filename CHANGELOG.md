# Changelog

All notable changes to `tablesync` and `tablesync-nest`. Versions follow [semver](https://semver.org); while in `0.x`, a minor version may break the API.

## 0.2.0 — 2026-11-05

**Upgrading `tablesync-nest`: run the new migration `AddTablesyncPageSizeOptions1793500000000` first.** The entity reads the new column, so every request fails without it.

### tablesync

- Users can set their own page sizes in the settings drawer (up to 10 sizes, at most 100 rows per page). Saved per user and table as `pageSizeOptions`.
- If the current `pageSize` isn't one of the user's sizes, the table calls `pagination.onChange(1, smallestSize)`.
- New labels `pageSizes` and `pageSizesHint`. Exports `MAX_PAGE_SIZE`, `MAX_PAGE_SIZE_OPTIONS`.

### tablesync-nest

- New column `page_size_options` and field `pageSizeOptions` (1–10 unique whole numbers from 1 to 100, or `null`). Migration `AddTablesyncPageSizeOptions1793500000000`.

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
