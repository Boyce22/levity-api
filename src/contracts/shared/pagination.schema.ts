import { Type, type StaticDecode } from '@sinclair/typebox';
import { coerceNumberSchema } from './typebox';

export const paginationSchema = Type.Object({
  page: coerceNumberSchema({ integer: true, min: 1, defaultValue: 1 }),
  limit: coerceNumberSchema({ integer: true, min: 1, max: 100, defaultValue: 20 }),
});

export type PaginationInput = StaticDecode<typeof paginationSchema>;
