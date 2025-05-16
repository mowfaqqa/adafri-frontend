/**
 * User model
 */
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string; // ID from the main auth system
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

/**
 * Access token
 */
export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}