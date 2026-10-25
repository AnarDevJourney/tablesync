import type { TableSettings, TableSettingsStorage } from "../types.js";

export interface RestStorageOptions {
  // Settings of a table live at `${baseUrl}/${tableKey}` (GET, PATCH, DELETE)
  baseUrl: string;
  // Extra headers (auth token …); a function is called for every request
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  // Cookies: "same-origin" (default) or "include" for another origin
  credentials?: RequestCredentials;
  // Your API wraps responses (e.g. { data: … })? Return the settings part
  unwrap?: (body: unknown) => Partial<TableSettings> | null;
  fetch?: typeof fetch;
}

// A non-2xx answer; `status` 0 = no answer at all (network error)
export class TableSyncRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TableSyncRequestError";
    this.status = status;
  }
}

// Storage over the REST contract of tablesync-nest (any backend can serve it):
//   GET    {baseUrl}/:tableKey → settings (404 = nothing saved)
//   PATCH  {baseUrl}/:tableKey   body = only the changed fields
//   DELETE {baseUrl}/:tableKey → back to the defaults
export function createRestStorage({
  baseUrl,
  headers,
  credentials = "same-origin",
  unwrap = (body) => body as Partial<TableSettings> | null,
  fetch: fetchImpl,
}: RestStorageOptions): TableSettingsStorage {
  const base = baseUrl.replace(/\/+$/, "");

  async function request(method: string, tableKey: string, body?: unknown) {
    const extra = typeof headers === "function" ? await headers() : headers;
    const init: RequestInit = {
      method,
      credentials,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...Object.fromEntries(new Headers(extra).entries()),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    };
    let response: Response;
    try {
      response = await (fetchImpl ?? fetch)(
        `${base}/${encodeURIComponent(tableKey)}`,
        init,
      );
    } catch (error) {
      throw new TableSyncRequestError(0, (error as Error).message || "Network error");
    }
    return response;
  }

  const fail = (response: Response) =>
    new TableSyncRequestError(
      response.status,
      `Table settings request failed (${response.status})`,
    );

  return {
    async load(tableKey) {
      const response = await request("GET", tableKey);
      if (response.status === 404) return null;
      if (!response.ok) throw fail(response);
      return unwrap(await response.json());
    },
    async save(tableKey, patch) {
      const response = await request("PATCH", tableKey, patch);
      if (!response.ok) throw fail(response);
    },
    async reset(tableKey) {
      const response = await request("DELETE", tableKey);
      if (!response.ok && response.status !== 404) throw fail(response);
    },
  };
}
