export interface UserResponse {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  created_at: string;
}

export interface UserPublicResponse {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}
