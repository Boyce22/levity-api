
import { Type } from '@sinclair/typebox';

export const uuidSchema = Type.String({ format: 'uuid' });
export const emailSchema = Type.String({ format: 'email' });
export const dateTimeSchema = Type.String({ format: 'date-time' });
export const dateOnlySchema = Type.String({ format: 'date' });

export interface CoerceNumberOptions {
  integer?: boolean;
  min?: number;
  max?: number;
  positive?: boolean;
  defaultValue?: number;
}

class SchemaTransformError extends Error { }

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
