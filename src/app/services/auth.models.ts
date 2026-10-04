export interface LoginCredentials {
  loginId: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthenticatedUser {
  userId: string;
}

export interface ApiErrorResponse {
  error: string;
  requestId?: string;
}