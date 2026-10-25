import type { MigrationInterface, QueryRunner } from "typeorm";

// Add to your TypeORM `migrations` (or copy the SQL). PostgreSQL.
export class CreateTablesyncSettings1793300000000 implements MigrationInterface {
  name = "CreateTablesyncSettings1793300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tablesync_settings (
          user_id     varchar(100) NOT NULL,
          table_key   varchar(60) NOT NULL,
          columns     jsonb,
          density     varchar(20),
          view        varchar(40),
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT pk_tablesync_settings PRIMARY KEY (user_id, table_key),
          CONSTRAINT chk_tablesync_settings_columns CHECK (columns IS NULL OR jsonb_typeof(columns) = 'array'),
          CONSTRAINT chk_tablesync_settings_density CHECK (density IN ('compact', 'comfortable'))
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE tablesync_settings;`);
  }
}
