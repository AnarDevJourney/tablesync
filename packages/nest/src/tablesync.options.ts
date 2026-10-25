export type UserIdResolver = (
  request: any, // Express, Fastify, …
) => string | number | null | undefined | Promise<string | number | null | undefined>;

export interface TableSyncModuleOptions {
  // Who is asking: read it from what your auth guard put on the request
  // (e.g. `req => req.user?.id`). null / undefined → 401.
  getUserId: UserIdResolver;
  // Route prefix of the three endpoints (default "table-settings")
  path?: string;
  // Stops a client from creating rows for invented table keys (default 200)
  maxTablesPerUser?: number;
}
