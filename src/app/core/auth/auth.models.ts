export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  displayName: string;
  role: string;
  expiresAtUtc: string;
  roles: string[];
  permissions: string[];
}

export interface CurrentUser {
  username: string;
  displayName: string;
  role: string;
  roles: string[];
}
