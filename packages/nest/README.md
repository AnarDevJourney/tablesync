# tablesync-nest

[![npm](https://img.shields.io/npm/v/tablesync-nest.svg)](https://www.npmjs.com/package/tablesync-nest)

NestJS backend for [tablesync](https://github.com/AnarDevJourney/tablesync), the Ant Design data table that saves each user's column layout, density and view on your server.

`GET` / `PATCH` / `DELETE /table-settings/:tableKey` for the signed-in user, with validation, per-user isolation and a PostgreSQL migration.

```bash
npm install tablesync-nest
```

```ts
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
      entities: [TableSyncSettings /* , … */],
      migrations: [CreateTablesyncSettings1793300000000 /* , … */],
    }),
    TableSyncModule.forRoot({
      getUserId: (req) => req.user?.id, // from your auth guard; null → 401
      path: "api/table-settings", // default "table-settings"
    }),
  ],
})
export class AppModule {}
```

On the frontend, with [`tablesync`](https://www.npmjs.com/package/tablesync):

```ts
import { createRestStorage } from "tablesync";
const storage = createRestStorage({ baseUrl: "/api/table-settings" });
```

The full documentation, including the REST contract and its validation rules, is on the [tablesync website](https://tablesyncpackage.netlify.app/docs#backend-nestjs).

Requires NestJS 11 or 12, TypeORM 0.3, PostgreSQL, class-validator and class-transformer. NestJS 12 needs Node 22.12+.

MIT © Anar Talibov
