export const SprintStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export const SprintTrackingMode = {
  POINTS: 'POINTS',
  COUNT: 'COUNT',
  HOURS: 'HOURS',
} as const;

export type SprintTrackingMode = (typeof SprintTrackingMode)[keyof typeof SprintTrackingMode];
