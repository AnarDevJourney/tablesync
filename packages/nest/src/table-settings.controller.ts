import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  type Type,
} from "@nestjs/common";
import { TABLESYNC_OPTIONS } from "./constants";
import { flattenValidationErrors, invalid } from "./errors";
import { TableKeyParam } from "./dto/table-key.param";
import { UpdateTableSettingsDto } from "./dto/update-table-settings.dto";
import { TableSettingsService } from "./table-settings.service";
import type { TableSyncModuleOptions } from "./tablesync.options";

// The route prefix is an option, so the controller class is made per module
export function createTableSettingsController(path: string): Type<unknown> {
  @Controller(path)
  // Own pipe: works whether or not the app has a global ValidationPipe
  // (a global one runs first, so the app's error format wins)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        invalid("Validation failed", flattenValidationErrors(errors)),
    }),
  )
  class TableSettingsController {
    constructor(
      private readonly tables: TableSettingsService,
      @Inject(TABLESYNC_OPTIONS) private readonly options: TableSyncModuleOptions,
    ) {}

    @Get(":tableKey")
    async get(@Param() { tableKey }: TableKeyParam, @Req() request: unknown) {
      return this.tables.get(await this.userId(request), tableKey);
    }

    @Patch(":tableKey")
    async update(
      @Param() { tableKey }: TableKeyParam,
      @Body() dto: UpdateTableSettingsDto,
      @Req() request: unknown,
    ) {
      return this.tables.update(await this.userId(request), tableKey, dto);
    }

    @Delete(":tableKey")
    @HttpCode(HttpStatus.NO_CONTENT)
    async reset(@Param() { tableKey }: TableKeyParam, @Req() request: unknown) {
      await this.tables.reset(await this.userId(request), tableKey);
    }

    private async userId(request: unknown): Promise<string> {
      const id = await this.options.getUserId(request);
      if (id === null || id === undefined || id === "") throw new UnauthorizedException();
      return String(id);
    }
  }
  return TableSettingsController;
}
