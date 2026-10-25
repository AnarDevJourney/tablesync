import { BadRequestException, type ValidationError } from "@nestjs/common";

export interface FieldError {
  field: string; // nested fields as paths: "columns.0.width"
  errors: string[];
}

// 400 with the failed fields: { statusCode, error, message, details: FieldError[] }
export const invalid = (message: string, details: FieldError[]) =>
  new BadRequestException({ statusCode: 400, error: "Bad Request", message, details });

export function flattenValidationErrors(
  errors: ValidationError[],
  parent = "",
): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints
      ? [{ field, errors: Object.values(error.constraints) }]
      : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
