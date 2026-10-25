import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  COLUMN_KEY,
  COLUMN_PINS,
  MAX_COLUMN_WIDTH,
  MAX_COLUMNS,
  MIN_COLUMN_WIDTH,
  SLUG,
  TABLE_DENSITIES,
} from "../constants";
import type { ColumnPin, TableDensity } from "../constants";

// Booleans and numbers as sent: implicit conversion would turn "yes" into true
const sent = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => obj[key];

export class TableColumnSettingDto {
  @Matches(COLUMN_KEY, {
    message: "key must be letters, digits, _ . - (max 60 characters)",
  })
  key: string;

  @Transform(sent)
  @IsBoolean()
  visible: boolean;

  @ValidateIf((_, value) => value !== null)
  @Transform(sent)
  @IsInt()
  @Min(MIN_COLUMN_WIDTH)
  @Max(MAX_COLUMN_WIDTH)
  width: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsIn(COLUMN_PINS)
  pinned: ColumnPin | null;
}

// PATCH /:tableKey — only the sent fields change; null sets a field back
// to the table's default
export class UpdateTableSettingsDto {
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsArray()
  @ArrayMaxSize(MAX_COLUMNS)
  @ValidateNested({ each: true })
  @Type(() => TableColumnSettingDto)
  columns?: TableColumnSettingDto[] | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsIn(TABLE_DENSITIES)
  density?: TableDensity | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Matches(SLUG, {
    message: "view must be a lowercase slug (a-z, 0-9, -), max 40 characters",
  })
  view?: string | null;
}
