import type { AccountStatus } from '../shared/roles.enum';

export interface UserSummary {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface UserResponse extends UserSummary {
  bio?: string;
  email?: string;
  account_status: AccountStatus;
  updated_at: string;
  last_login_at?: string;
  created_at: string;
}

export interface UserPublicResponse extends UserSummary {}
