export interface AuthTokens {
  accessToken: string;
  user: { id: string; userName: string };
}

export interface AuthPayload {
  id: string;
  username: string;
}
