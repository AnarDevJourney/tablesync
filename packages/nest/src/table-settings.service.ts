import { Inject, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { DEFAULT_MAX_TABLES_PER_USER, TABLESYNC_OPTIONS } from "./constants";
import type { TableDensity } from "./constants";
import type { UpdateTableSettingsDto } from "./dto/update-table-settings.dto";
import { invalid } from "./errors";
import { TableSyncSettings, type TableColumnSetting } from "./table-settings.entity";
import type { TableSyncModuleOptions } from "./tablesync.options";

export interface TableSettingsResponse {
  tableKey: string;
  columns: TableColumnSetting[] | null; // null = table defaults
  density: TableDensity | null;
  view: string | null;
  updatedAt: Date | null; // null = nothing saved yet
}

// DTO field → column. Only these can be written by PATCH.
const FIELDS = {
  columns: { column: "columns", json: true },
  density: { column: "density", json: false },
  view: { column: "view", json: false },
} as const satisfies Record<
  keyof UpdateTableSettingsDto,
  { column: string; json: boolean }
>;

// Each user reads and writes only their own rows.
@Injectable()
export class TableSettingsService {
  constructor(
    @InjectRepository(TableSyncSettings)
    private readonly settings: Repository<TableSyncSettings>,
    @Inject(TABLESYNC_OPTIONS)
    private readonly options: TableSyncModuleOptions,
  ) {}

  async get(userId: string, tableKey: string): Promise<TableSettingsResponse> {
    const row = await this.settings.findOneBy({ userId, tableKey });
    return row
      ? {
          tableKey: row.tableKey,
          columns: row.columns,
          density: row.density,
          view: row.view,
          updatedAt: row.updatedAt,
        }
      : { tableKey, columns: null, density: null, view: null, updatedAt: null };
  }

  // Upsert of the sent fields only
  async update(
    userId: string,
    tableKey: string,
    dto: UpdateTableSettingsDto,
  ): Promise<TableSettingsResponse> {
    if (dto.columns) assertUniqueKeys(dto.columns);

    const fields = (Object.keys(FIELDS) as (keyof typeof FIELDS)[]).filter(
      (key) => dto[key] !== undefined,
    );
    if (fields.length === 0) return this.get(userId, tableKey);
    await this.assertRoomForNewTable(userId, tableKey);

    const columns = fields.map((key) => FIELDS[key].column);
    const params: unknown[] = [userId, tableKey];
    const placeholders = fields.map((key) => {
      const { json } = FIELDS[key];
      const value = dto[key];
      // null must be SQL NULL ("back to default"), not the JSON value null
      params.push(json && value !== null ? JSON.stringify(value) : value);
      return `$${params.length}${json ? "::jsonb" : ""}`;
    });

    const table = this.settings.metadata.tablePath;
    await this.settings.query(
      `INSERT INTO ${table} (user_id, table_key, ${columns.join(", ")})
       VALUES ($1, $2, ${placeholders.join(", ")})
       ON CONFLICT (user_id, table_key) DO UPDATE SET
         ${columns.map((c) => `${c} = EXCLUDED.${c}`).join(", ")},
         updated_at = now()`,
      params,
    );
    return this.get(userId, tableKey);
  }

  // "Reset to default": the row goes, the table uses its defaults again
  async reset(userId: string, tableKey: string): Promise<void> {
    await this.settings.delete({ userId, tableKey });
  }

  private async assertRoomForNewTable(userId: string, tableKey: string) {
    const max = this.options.maxTablesPerUser ?? DEFAULT_MAX_TABLES_PER_USER;
    if (await this.settings.existsBy({ userId, tableKey })) return;
    if ((await this.settings.countBy({ userId })) < max) return;
    throw new UnprocessableEntityException(
      `At most ${max} tables can have saved settings`,
    );
  }
}

function assertUniqueKeys(columns: { key: string }[]): void {
  const seen = new Set<string>();
  const duplicates = columns
    .map((column) => column.key)
    .filter((key) => seen.has(key) || !seen.add(key));
  if (duplicates.length > 0) {
    throw invalid("Invalid table columns", [
      { field: "columns", errors: duplicates.map((key) => `duplicate column "${key}"`) },
    ]);
  }
}
