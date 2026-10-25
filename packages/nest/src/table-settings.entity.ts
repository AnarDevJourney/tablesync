import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ColumnPin, TableDensity } from "./constants";

export interface TableColumnSetting {
  key: string;
  visible: boolean;
  width: number | null; // null = the column's default width
  pinned: ColumnPin | null;
}

// Settings of one table for one user. Table and column keys are defined by
// the frontend; NULL = use the table's default. PostgreSQL (jsonb).
// Column names are explicit: the raw upsert and the migration use them,
// whatever naming strategy the app has.
@Entity("tablesync_settings")
export class TableSyncSettings {
  @PrimaryColumn({ name: "user_id", type: "varchar", length: 100 })
  userId: string;

  @PrimaryColumn({ name: "table_key", type: "varchar", length: 60 })
  tableKey: string;

  // [{ key, visible, width, pinned }] in display order
  @Column({ type: "jsonb", nullable: true })
  columns: TableColumnSetting[] | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  density: TableDensity | null;

  // Preset look ('classic', 'striped', 'grid', …)
  @Column({ type: "varchar", length: 40, nullable: true })
  view: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
