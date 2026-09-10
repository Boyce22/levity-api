import type { SprintStatus, SprintTrackingMode } from './enums';

export interface SprintIssueResponse {
  id: string;
  sprint_id: string;
  issue_id: string;
  position: number;
  added_at: string;
  moved_to_sprint_id?: string;
  issue: {
    id: string;
    content: string;
    story_points?: number;
    estimated_hours?: number;
    column_id: string;
  };
}

export interface SprintResponse {
  id: string;
  board_id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  tracking_mode: SprintTrackingMode;
  capacity_points?: number;
  velocity_points?: number;
  created_by: string;
  created_at: string;
  issues?: SprintIssueResponse[];
  total_issues: number;
  completed_issues: number;
  progress_percent: number;
}
