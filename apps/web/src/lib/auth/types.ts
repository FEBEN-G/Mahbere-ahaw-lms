export type UserRole = "SUPER_ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}
