export const SprintStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export const SprintTrackingMode = {
  POINTS: 'points',
  COUNT: 'count',
  HOURS: 'hours',
} as const;

export type SprintTrackingMode = (typeof SprintTrackingMode)[keyof typeof SprintTrackingMode];
