import type { StaticDecode, TSchema } from '@sinclair/typebox';
import { AssertError, TransformDecodeError, Value } from '@sinclair/typebox/value';
import { UnprocessableEntityError } from './errors/index';

function formatPath(path: string): string {
  return path.replace(/^\//, '').split('/').join('.') || 'value';
}

function validationMessage(error: AssertError): string {
  return [...error.Errors()]
    .map((issue) => `${formatPath(issue.path)}: ${issue.message}`)
    .join(', ');
}

export function validateDto<S extends TSchema>(schema: S, data: unknown): StaticDecode<S> {
  try {
    // Conversion is intentionally omitted here. Schemas that accept query/env strings
    // use an explicit Type.Transform so request bodies remain strict.
    return Value.Parse(['Clone', 'Clean', 'Default', 'Assert', 'Decode'], schema, data) as StaticDecode<S>;
  } catch (error) {
    if (error instanceof AssertError) {
      throw new UnprocessableEntityError(validationMessage(error));
    }
    if (error instanceof TransformDecodeError) {
      throw new UnprocessableEntityError(`${formatPath(error.path)}: ${error.message}`);
    }
    throw error;
  }
}
