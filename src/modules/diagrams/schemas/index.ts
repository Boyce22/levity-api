import { z } from 'zod';

const diagramElementSchema = z.object({
  type: z.enum(['path', 'rect', 'circle', 'db', 'cloud', 'server', 'user', 'arrow', 'line', 'eraser']),
  points: z.array(z.object({ x: z.number(), y: z.number() })).max(2500).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  color: z.string().optional(),
  size: z.number().optional(),
  id: z.string(),
});

export const saveDiagramSchema = z.object({
  card_id: z.uuid(),
  data: z.object({
    elements: z.array(diagramElementSchema).max(1000),
  }),
});
export type SaveDiagramInput = z.infer<typeof saveDiagramSchema>;
