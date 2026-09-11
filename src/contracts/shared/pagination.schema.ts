import { Type, type Static } from '@sinclair/typebox';

export const paginationSchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
});

export type PaginationInput = Static<typeof paginationSchema>;
