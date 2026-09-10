export interface UserResponse {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  created_at: string;
}

export interface UserPublicResponse {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}
