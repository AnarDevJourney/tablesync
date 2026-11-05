import type { MigrationInterface, QueryRunner } from "typeorm";

// Add to your TypeORM `migrations` after CreateTablesyncSettings (or copy
// the SQL). PostgreSQL.
export class AddTablesyncPageSizeOptions1793500000000 implements MigrationInterface {
  name = "AddTablesyncPageSizeOptions1793500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tablesync_settings
        ADD COLUMN page_size_options jsonb,
        ADD CONSTRAINT chk_tablesync_settings_page_sizes
          CHECK (page_size_options IS NULL OR jsonb_typeof(page_size_options) = 'array');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tablesync_settings
        DROP CONSTRAINT chk_tablesync_settings_page_sizes,
        DROP COLUMN page_size_options;
    `);
  }
}
