# tablesync

**An Ant Design data table that remembers how each user likes it, on your server, on every device.**

Users drag columns into their own order, hide the ones they don't need, resize, pin, and pick a density and a look. tablesync saves those choices **per user**, so the table looks the same on their laptop tomorrow and on their phone next week. You describe the columns once in code; tablesync handles the rest, frontend _and_ backend.

[![npm](https://img.shields.io/npm/v/tablesync.svg?label=tablesync)](https://www.npmjs.com/package/tablesync)
[![npm](https://img.shields.io/npm/v/tablesync-nest.svg?label=tablesync-nest)](https://www.npmjs.com/package/tablesync-nest)
[![CI](https://github.com/AnarDevJourney/tablesync/actions/workflows/ci.yml/badge.svg)](https://github.com/AnarDevJourney/tablesync/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> **Status: 0.x, pre-release.** The API may still change between minor versions. tablesync grows out of a real product ([MedFlow](https://github.com/AnarDevJourney/medflow-frontend)), where every list page runs on it.

---

## Contents

- [Why tablesync](#why-tablesync)
- [Packages](#packages)
- [Install](#install)
- [Quick start: no backend](#quick-start-no-backend)
- [Save settings on your server](#save-settings-on-your-server)
- [Backend: NestJS](#backend-nestjs)
- [Backend: anything else (REST contract)](#backend-anything-else-rest-contract)
- [Columns](#columns)
- [`DataTable` props](#datatable-props)
- [`TableSyncProvider`](#tablesyncprovider)
- [Storage adapters](#storage-adapters)
- [Texts and i18n](#texts-and-i18n)
- [Theming](#theming)
- [Views](#views)
- [How code defaults and saved settings merge](#how-code-defaults-and-saved-settings-merge)
- [Rules](#rules)
- [Requirements](#requirements)
- [Roadmap](#roadmap)
- [Development](#development)

---

## Why tablesync

|                                  | tablesync                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Per-user, server-side**        | Settings are saved through a storage adapter. Use your REST API and they follow the user to every browser. Use `localStorage` and you need no backend at all.                                     |
| **Backend included**             | A NestJS + TypeORM module (`tablesync-nest`) with validation, per-user isolation and a migration. Prefer another stack? Three small endpoints ([contract](#backend-anything-else-rest-contract)). |
| **Users shape it in place**      | Drag a header to reorder, drag its edge to resize (double-click resets), and a settings drawer for show/hide, pinning, density and views.                                                         |
| **6 views with live previews**   | Classic, striped, grid, minimal, cards, status accent. Every preview is drawn from the user's own columns.                                                                                        |
| **Code defaults stay in charge** | The backend stores only what the user changed. `null` means "whatever the code says today", so new columns and new default widths reach everyone without a migration.                             |
| **Built-in states**              | Skeleton rows on first load, dimmed rows on refetch, empty and error states, a ⋮ row-actions menu.                                                                                                |
| **Fits your app**                | Follows your AntD theme (light, dark, custom tokens) and takes your texts from any i18n library.                                                                                                  |

Sorting and pagination are **server-side**: the table reports what the user clicked, and you pass it on to your API.

## Packages

| Package                                                          | Version                                                                                                 | What it is                                                                                                       | Source                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`tablesync`](https://www.npmjs.com/package/tablesync)           | [![npm](https://img.shields.io/npm/v/tablesync.svg)](https://www.npmjs.com/package/tablesync)           | The React component (`DataTable`), `TableSyncProvider`, and the `localStorage` and REST storage adapters         | [`packages/react`](./packages/react) |
| [`tablesync-nest`](https://www.npmjs.com/package/tablesync-nest) | [![npm](https://img.shields.io/npm/v/tablesync-nest.svg)](https://www.npmjs.com/package/tablesync-nest) | NestJS module: `GET` / `PATCH` / `DELETE /table-settings/:tableKey` for the signed-in user (TypeORM, PostgreSQL) | [`packages/nest`](./packages/nest)   |

## Install

```bash
npm install tablesync
# peer dependencies, if you don't have them yet
npm install antd @ant-design/icons @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Import the stylesheet once, for example in your entry file:

```ts
import "tablesync/styles.css";
```

## Quick start: no backend

Without a provider, settings live in the browser's `localStorage` and all texts are English.

```tsx
import { DataTable, type DataTableColumn } from "tablesync";
import "tablesync/styles.css";

type User = { id: number; name: string; email: string; role: string };

const columns: DataTableColumn<User>[] = [
  { key: "name", title: "Name", dataIndex: "name", width: 220, hideable: false },
  { key: "email", title: "Email", dataIndex: "email", width: 260 },
  { key: "role", title: "Role", dataIndex: "role", width: 140 },
];

export function UsersPage({ users }: { users: User[] }) {
  return <DataTable tableKey="users" columns={columns} data={users} rowKey="id" />;
}
```

Every table needs a `tableKey`: the name its settings are saved under.

## Save settings on your server

Wrap the signed-in part of your app in `TableSyncProvider` and give it a storage adapter:

```tsx
import { createRestStorage, TableSyncProvider } from "tablesync";

// module level: a new storage object would start a new cache
const storage = createRestStorage({ baseUrl: "/api/table-settings" });

export function SignedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <TableSyncProvider storage={storage} stickyOffset={64}>
      {children}
    </TableSyncProvider>
  );
}
```

The provider keeps a cache of every table's settings for as long as it is mounted. Mount it **inside** the part of the app that only signed-in users see, or give it `key={user.id}`, so one user never sees another user's cached settings.

A change shows up in the table immediately and is then saved in the background. Saves of one table go out in order. If one fails, `onSaveError` is called and the table reloads what the server really has. If loading fails, the table falls back to the code defaults and keeps working.

## Backend: NestJS

```bash
npm install tablesync-nest
```

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CreateTablesyncSettings1793300000000,
  TableSyncModule,
  TableSyncSettings,
} from "tablesync-nest";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [/* your entities */ TableSyncSettings],
      migrations: [/* your migrations */ CreateTablesyncSettings1793300000000],
    }),
    TableSyncModule.forRoot({
      // read the user from whatever your auth guard put on the request
      getUserId: (req) => req.user?.id,
      path: "api/table-settings", // default "table-settings"
      maxTablesPerUser: 200, // default 200
    }),
  ],
})
export class AppModule {}
```

- **Auth stays yours.** The module only reads the user id through `getUserId`. If that returns `null` or `undefined`, the request gets a 401. Your global guards run before it as usual.
- **Validation is built in.** The controller has its own `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`), so it works whether or not your app has a global one.
- **Database:** PostgreSQL (`jsonb`). The table is `tablesync_settings`. Run the bundled migration, or create the table yourself with the SQL in `CreateTablesyncSettings1793300000000`. Column names are explicit, so any TypeORM naming strategy works.
- **Errors** are standard Nest exceptions, so your exception filter shapes them: `400` (bad input; the body has `details: [{ field, errors }]`, e.g. `columns.0.width`), `401` (no user), `422` (too many tables).
- `TableSettingsService` is exported too, for use from your own code (for example, to delete a user's settings when you delete the user).

## Backend: anything else (REST contract)

`createRestStorage({ baseUrl })` speaks three endpoints. `tablesync-nest` implements them, and so can any backend.

| Request                      | Body                    | Answer                                    |
| ---------------------------- | ----------------------- | ----------------------------------------- |
| `GET {baseUrl}/:tableKey`    | —                       | `200` settings (or `404` = nothing saved) |
| `PATCH {baseUrl}/:tableKey`  | only the changed fields | `2xx` (body ignored)                      |
| `DELETE {baseUrl}/:tableKey` | —                       | `2xx` or `404`: back to the defaults      |

```jsonc
// settings of one table for the signed-in user; null = "use the code default"
{
  "columns": [
    // every column, in display order
    { "key": "email", "visible": true, "width": 240, "pinned": "left" }, // width null = default
    { "key": "role", "visible": false, "width": null, "pinned": null },
  ],
  "density": "comfortable", // "compact" | "comfortable" | null
  "view": "striped", // a view id | null
}
```

Validation used by `tablesync-nest`:

- `tableKey` and `view`: `^[a-z0-9][a-z0-9-]{0,39}$`
- column `key`: `^[A-Za-z0-9][A-Za-z0-9_.-]{0,59}$`, unique within the array
- at most 60 columns
- `width`: an integer from 40 to 1200, or `null`
- `pinned`: `"left"`, `"right"` or `null`

Responses wrapped in an envelope (`{ "data": … }`)? Pass `unwrap: (body) => body.data`. Need an auth header? Pass a `headers` function that returns it, e.g. `() => ({ Authorization: "Bearer " + getToken() })`. Cookies on another origin? Pass `credentials: "include"`.

## Columns

`DataTableColumn<T>`:

| Field                   | Type                                  | Default                   | Meaning                                                                                                                                               |
| ----------------------- | ------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`                   | `string`                              | required                  | **Stable id, saved in user settings. Never rename it.** Using your API field name (`lastName`, `createdAt`) keeps sort keys and column keys the same. |
| `title`                 | `string`                              | required                  | Plain text: the header, and the column's name in the settings drawer                                                                                  |
| `header`                | `ReactNode`                           | `title`                   | Custom header content (icon, tooltip). The drawer still shows `title`.                                                                                |
| `dataIndex`             | `keyof T \| string[]`                 | —                         | Field to read. Nested path as an array: `["owner", "name"]`                                                                                           |
| `render`                | `(value, record, index) => ReactNode` | —                         | Custom cell                                                                                                                                           |
| `width`                 | `number`                              | `160`                     | Default width in px                                                                                                                                   |
| `minWidth` / `maxWidth` | `number`                              | `72` / `800`              | Resize limits                                                                                                                                         |
| `align`                 | `"left" \| "center" \| "right"`       | left (right if `numeric`) | Cell alignment                                                                                                                                        |
| `numeric`               | `boolean`                             | `false`                   | Tabular figures, right aligned: numbers, money, times                                                                                                 |
| `sortable`              | `boolean`                             | `false`                   | Shows the sorter; clicks are reported through `onSortChange`                                                                                          |
| `ellipsis`              | `boolean`                             | `true`                    | Truncate long text with `…`                                                                                                                           |
| `defaultHidden`         | `boolean`                             | `false`                   | Hidden until the user turns it on                                                                                                                     |
| `defaultPinned`         | `"left" \| "right"`                   | —                         | Pinned by default                                                                                                                                     |
| `hideable`              | `boolean`                             | `true`                    | `false` = always shown; the drawer checkbox is disabled                                                                                               |

Keep the `columns` array stable (module level or `useMemo`).

## `DataTable` props

| Prop                    | Type                                                             | Default              | Notes                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tableKey`              | `string`                                                         | required             | Settings key, a lowercase slug of up to 40 characters (`users`, `lab-queue`). One per table.                                        |
| `columns`               | `DataTableColumn<T>[]`                                           | required             | See [Columns](#columns)                                                                                                             |
| `data`                  | `T[] \| undefined`                                               | required             | `undefined` while the first page loads                                                                                              |
| `rowKey`                | `keyof T \| (record) => Key`                                     | required             | Unique row id                                                                                                                       |
| `loading`               | `boolean`                                                        | `false`              | First load: skeleton rows. Refetch with data on screen: dimmed rows.                                                                |
| `error`                 | `Error \| null`                                                  | —                    | Error state with the message                                                                                                        |
| `onRetry`               | `() => void`                                                     | —                    | Adds a retry button to the error state                                                                                              |
| `empty`                 | `{ title, description?, action?, icon? }`                        | generic text         | Custom empty state, e.g. "No results" plus a "Clear filters" button                                                                 |
| `pagination`            | `{ page, pageSize, total, onChange, pageSizeOptions? } \| false` | —                    | Server-side pagination                                                                                                              |
| `sort` / `onSortChange` | `{ key, order: "asc" \| "desc" } \| null`                        | —                    | Controlled, server-side sorting                                                                                                     |
| `onRowClick`            | `(record) => void`                                               | —                    | Clickable, focusable rows; **Enter** works too                                                                                      |
| `rowAccent`             | `(record) => string \| undefined`                                | —                    | CSS color for the row's stripe in the "Status accent" view. Without it, that view is not offered.                                   |
| `rowSelection`          | AntD `rowSelection`                                              | —                    | Passed through to AntD                                                                                                              |
| `rowActions`            | `(record) => (DataTableRowAction \| "divider")[]`                | —                    | ⋮ menu at the end of every row. `{ key, label, icon?, onClick, danger?, disabled? }`. Dividers at the edges or doubled are dropped. |
| `onViewDetails`         | `(record) => void`                                               | —                    | Adds "View details" as the first item of the ⋮ menu                                                                                 |
| `rowLabel`              | `(record) => string`                                             | —                    | The row's name for screen readers: "Actions for <name>"                                                                             |
| `toolbar`               | `ReactNode`                                                      | —                    | Left side of the toolbar (search, filters)                                                                                          |
| `actions`               | `ReactNode`                                                      | —                    | Right side of the toolbar, before the ⚙ button                                                                                      |
| `defaultDensity`        | `"compact" \| "comfortable"`                                     | `"compact"`          | Code default                                                                                                                        |
| `defaultView`           | `TableViewId`                                                    | `"classic"`          | Code default                                                                                                                        |
| `configurable`          | `boolean`                                                        | `true`               | `false` hides ⚙ and turns off header drag and resize (small embedded tables)                                                        |
| `stickyOffset`          | `number`                                                         | provider's, else `0` | Sticky header offset: the height of your top bar                                                                                    |

A fuller page with server-side sorting and paging:

```tsx
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [sort, setSort] = useState<DataTableSort | null>(null);
const users = useUsers({ page, pageSize, sort }); // your data hook

<DataTable<User>
  tableKey="users"
  columns={columns}
  data={users.data?.items}
  rowKey="id"
  loading={users.isFetching}
  error={users.error}
  onRetry={users.refetch}
  sort={sort}
  onSortChange={(next) => {
    setSort(next);
    setPage(1);
  }}
  pagination={{
    page,
    pageSize,
    total: users.data?.total ?? 0,
    onChange: (p, size) => {
      setPage(size === pageSize ? p : 1);
      setPageSize(size);
    },
  }}
  onRowClick={(user) => openUser(user.id)}
  rowAccent={(user) => (user.active ? "#16a34a" : "#9ca3af")}
  rowActions={(user) => [
    { key: "edit", label: "Edit", onClick: () => edit(user) },
    "divider",
    { key: "delete", label: "Delete", danger: true, onClick: () => remove(user) },
  ]}
  toolbar={<Input.Search placeholder="Search" onSearch={setSearch} />}
  actions={<Button type="primary">Invite</Button>}
/>;
```

## `TableSyncProvider`

| Prop           | Type                        | Default                | Notes                                                                      |
| -------------- | --------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `storage`      | `TableSettingsStorage`      | `createLocalStorage()` | Where settings are saved. Keep it stable: a new object starts a new cache. |
| `labels`       | `Partial<TableSyncLabels>`  | English                | Your texts; missing ones fall back to English. Memoize them.               |
| `onSaveError`  | `(error, tableKey) => void` | `console.error`        | A change could not be saved. Show a toast here.                            |
| `stickyOffset` | `number`                    | `0`                    | Default sticky header offset of every table                                |

`useTableSettings(tableKey)` gives you `{ settings, update, reset }` for one table, if you want to build your own controls.

## Storage adapters

```ts
interface TableSettingsStorage {
  load(tableKey: string): Promise<Partial<TableSettings> | null>; // null = nothing saved
  save(tableKey: string, patch: Partial<TableSettings>): Promise<unknown>; // only the changed fields
  reset(tableKey: string): Promise<unknown>;
}
```

Two adapters come with the package:

- `createLocalStorage({ prefix?: "tablesync:" })`: no backend needed. If several people share a browser, use one prefix per user. Blocked storage (private mode, full quota) behaves like "nothing saved".
- `createRestStorage({ baseUrl, headers?, credentials?, unwrap?, fetch? })`: the [REST contract](#backend-anything-else-rest-contract). Failed requests throw `TableSyncRequestError` with a `status` (`0` = no answer at all).

Your own adapter takes a few lines, for example over an axios client you already have:

```ts
const storage: TableSettingsStorage = {
  load: async (key) => (await api.get(`/me/tables/${key}`)).data,
  save: (key, patch) => api.patch(`/me/tables/${key}`, patch),
  reset: (key) => api.delete(`/me/tables/${key}`),
};
```

## Texts and i18n

Every text is in `labels`. Texts with values in them are functions:

```tsx
import { useTranslation } from "react-i18next";
import { TABLE_VIEWS, TableSyncProvider, type TableSyncLabels } from "tablesync";

function I18nTableSync({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const labels = useMemo<Partial<TableSyncLabels>>(
    () => ({
      settings: t("table.settings"),
      emptyTitle: t("table.emptyTitle"),
      total: (from, to, total) => t("table.total", { from, to, total }),
      visibleCount: (visible, total) => t("table.visibleCount", { visible, total }),
      views: Object.fromEntries(
        TABLE_VIEWS.map((id) => [
          id,
          { name: t(`table.views.${id}.name`), desc: t(`table.views.${id}.desc`) },
        ]),
      ) as TableSyncLabels["views"],
      // …
    }),
    [t], // react-i18next gives a new `t` when the language changes
  );
  return <TableSyncProvider labels={labels}>{children}</TableSyncProvider>;
}
```

`DEFAULT_LABELS` has every key, with its English text.

## Theming

tablesync follows your AntD theme on its own: light, dark, and custom tokens. To fine-tune it, set any of these CSS variables, for example on `:root`:

| Variable                                                | Default (AntD token)                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| `--tablesync-text`                                      | `colorText`                                                      |
| `--tablesync-muted`                                     | `colorTextSecondary`                                             |
| `--tablesync-primary`                                   | `colorPrimary`                                                   |
| `--tablesync-primary-soft`                              | `colorPrimaryBg`                                                 |
| `--tablesync-error`                                     | `colorError`                                                     |
| `--tablesync-border`                                    | `colorBorderSecondary`                                           |
| `--tablesync-card`                                      | `colorBgContainer`                                               |
| `--tablesync-bg`                                        | `colorBgLayout`                                                  |
| `--tablesync-hover`                                     | `colorFillAlter` (header tint, stripes)                          |
| `--tablesync-shadow`                                    | `boxShadowSecondary` (dragged items)                             |
| `--tablesync-radius-sm` / `-md` / `-lg`                 | `borderRadiusSM` / `borderRadius` / `borderRadiusLG`             |
| `--tablesync-font-size-xs` / `-sm` / `-md` / `-lg`      | `fontSizeSM` / `fontSizeSM` / `fontSize` / `fontSizeLG`          |
| `--tablesync-font-size-icon`                            | `fontSizeHeading2` (empty and error state icons)                 |
| `--tablesync-motion-fast` / `-base`, `--tablesync-ease` | `motionDurationFast` / `motionDurationMid`, `motionEaseOut`      |
| `--tablesync-accent-1` … `-4`                           | primary, warning, success, error (stripes in the accent preview) |

```css
:root {
  --tablesync-border: var(--my-border);
  --tablesync-radius-lg: 12px;
}
```

## Views

A view is CSS only: the columns, data and behaviour stay the same.

| id        | Look                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| `classic` | Tinted header, a line between rows (default)                                               |
| `striped` | Every other row tinted: easy to follow long rows                                           |
| `grid`    | Lines around every cell, like a spreadsheet                                                |
| `minimal` | No fills, hardly any lines                                                                 |
| `cards`   | Each row is a separate card                                                                |
| `accent`  | A colored stripe from `rowAccent(record)`. Offered only when the table passes `rowAccent`. |

## How code defaults and saved settings merge

| Property | Saved value present                          | Nothing saved                                                         |
| -------- | -------------------------------------------- | --------------------------------------------------------------------- |
| visible  | saved (always `true` when `hideable: false`) | `!defaultHidden`                                                      |
| width    | saved, clamped to `[minWidth, maxWidth]`     | `width ?? 160`                                                        |
| pinned   | saved                                        | `defaultPinned ?? null`                                               |
| order    | position in the saved list                   | right after the saved column that comes before it in your definitions |

Columns end up in this order: **left-pinned, unpinned, right-pinned**, with the saved order inside each group.

Changing a table in code is safe:

- **New column:** appears for everyone at its place from the definitions, even for users who saved a layout.
- **Removed column:** its saved entry is ignored, and dropped on the next save.
- **New default width:** applies to everyone who never resized that column.

## Rules

- **Never rename a `tableKey` or a column `key`.** They are stored in users' settings. Renaming one quietly resets that table or column for everyone.
- `title` is plain text. Icons and tooltips go in `header`.
- Give tables with a status column a `rowAccent`.
- Sorting is server-side: make sure your API accepts the column `key` as a sort field, or map it.
- Resizing sends a single request per drag, when the pointer is released.

## Requirements

- React 18.2+ or 19, Ant Design 6.6+, `@dnd-kit/core` 6, `@dnd-kit/sortable` 10, `@dnd-kit/utilities` 3
- An ES-module bundler (Vite, webpack 5, Next.js, …). The bundle is marked `"use client"` for React Server Components.
- `tablesync-nest`: NestJS 11 or 12, TypeORM 0.3, PostgreSQL, class-validator and class-transformer. NestJS 12 needs Node 22.12 or newer.

## Roadmap

- [ ] Docs website with live examples
- [ ] `forRootAsync` for `tablesync-nest`
- [ ] Server-side paging, sorting and filtering helpers (query contract + TypeORM helper)
- [ ] More databases for `tablesync-nest` (MySQL, SQLite)
- [ ] Saved filters per table

Ideas and issues are welcome: [GitHub issues](https://github.com/AnarDevJourney/tablesync/issues).

## Development

```bash
npm install
npm run build        # both packages
npm test             # unit tests; the NestJS e2e tests need a database:
TABLESYNC_TEST_DATABASE_URL=postgres://user:pass@localhost:5432/tablesync_test npm test
npm run typecheck
npm run format
```

The e2e tests drop and re-create the schema of that database, so use one you can throw away.

## License

[MIT](./LICENSE) © Anar Talibov
