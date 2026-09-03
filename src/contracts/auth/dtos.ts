export interface AuthTokens {
  accessToken: string;
  user: { id: string; username: string };
}

export interface AuthPayload {
  id: string;
  username: string;
}
