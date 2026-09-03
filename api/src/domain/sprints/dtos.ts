import type { SprintStatus, SprintTrackingMode } from './enums';

export interface SprintCardResponse {
  id: string;
  sprint_id: string;
  card_id: string;
  position: number;
  added_at: string;
  moved_to_sprint_id?: string;
  card: {
    id: string;
    content: string;
    story_points?: number;
    estimated_hours?: number;
    list_id: string;
  };
}

export interface SprintResponse {
  id: string;
  workspace_id: string;
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
  cards?: SprintCardResponse[];
  total_cards: number;
  completed_cards: number;
  progress_percent: number;
}

export interface CardHistoryResponse {
  id: string;
  created_by: string;
  action_type: string;
  field: string;
  old_val?: string;
  new_val?: string;
  created_at: string;
  users?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}
