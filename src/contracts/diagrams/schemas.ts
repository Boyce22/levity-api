import { Type, type Static } from '@sinclair/typebox';
import { uuidSchema } from '../shared/typebox';

const diagramElementSchema = Type.Object({
  type: Type.Union([
    Type.Literal('path'), Type.Literal('rect'), Type.Literal('circle'), Type.Literal('db'),
    Type.Literal('cloud'), Type.Literal('server'), Type.Literal('user'), Type.Literal('arrow'),
    Type.Literal('line'), Type.Literal('eraser'),
  ]),
  points: Type.Optional(Type.Array(Type.Object({ x: Type.Number(), y: Type.Number() }), { maxItems: 2500 })),
  x: Type.Optional(Type.Number()),
  y: Type.Optional(Type.Number()),
  width: Type.Optional(Type.Number()),
  height: Type.Optional(Type.Number()),
  color: Type.Optional(Type.String()),
  size: Type.Optional(Type.Number()),
  id: Type.String(),
});

export const saveDiagramSchema = Type.Object({
  card_id: uuidSchema,
  data: Type.Object({
    elements: Type.Array(diagramElementSchema, { maxItems: 1000 }),
  }),
});
export type SaveDiagramInput = Static<typeof saveDiagramSchema>;
