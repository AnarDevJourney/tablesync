import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TABLESYNC_OPTIONS } from "./constants";
import { createTableSettingsController } from "./table-settings.controller";
import { TableSyncSettings } from "./table-settings.entity";
import { TableSettingsService } from "./table-settings.service";
import type { TableSyncModuleOptions } from "./tablesync.options";

// GET / PATCH / DELETE /<path>/:tableKey for the signed-in user.
// Needs TypeOrmModule.forRoot (PostgreSQL) with the TableSyncSettings entity.
@Module({})
export class TableSyncModule {
  static forRoot(options: TableSyncModuleOptions): DynamicModule {
    return {
      module: TableSyncModule,
      imports: [TypeOrmModule.forFeature([TableSyncSettings])],
      controllers: [createTableSettingsController(options.path ?? "table-settings")],
      providers: [
        { provide: TABLESYNC_OPTIONS, useValue: options },
        TableSettingsService,
      ],
      exports: [TableSettingsService],
    };
  }
}
