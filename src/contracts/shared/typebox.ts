import { Type } from '@sinclair/typebox';

const uuidPattern =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

const emailPattern = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+.-]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export const uuidSchema = Type.String({ pattern: uuidPattern.source });
export const emailSchema = Type.String({ pattern: emailPattern.source });
export const dateTimeSchema = Type.String({ pattern: dateTimePattern.source });

export function dateOnlySchema() {
  return Type.String({ pattern: /^\d{4}-\d{2}-\d{2}$/.source });
}

export interface CoerceNumberOptions {
  integer?: boolean;
  min?: number;
  max?: number;
  positive?: boolean;
  defaultValue?: number;
}

class SchemaTransformError extends Error {}

/** A TypeBox transform for the explicit string-to-number coercions used by query/env inputs. */
export function coerceNumberSchema(options: CoerceNumberOptions = {}) {
  const source = Type.Any(
    options.defaultValue === undefined ? {} : { default: options.defaultValue },
  );

  return Type.Transform(source)
    .Decode((value) => {
      if (value === undefined) return undefined as never;
      const number = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(number)) throw new SchemaTransformError('Expected a number');
      if (options.integer && !Number.isInteger(number)) throw new SchemaTransformError('Expected an integer');
      if (options.positive && number <= 0) throw new SchemaTransformError('Expected a positive number');
      if (options.min !== undefined && number < options.min) {
        throw new SchemaTransformError(`Expected number greater than or equal to ${options.min}`);
      }
      if (options.max !== undefined && number > options.max) {
        throw new SchemaTransformError(`Expected number less than or equal to ${options.max}`);
      }
      return number;
    })
    .Encode((value) => value);
}

export const booleanQuerySchema = Type.Transform(
  Type.Union([Type.Boolean(), Type.Literal('true'), Type.Literal('false')]),
)
  .Decode((value) => (value === 'true' ? true : value === 'false' ? false : value))
  .Encode((value) => value);
