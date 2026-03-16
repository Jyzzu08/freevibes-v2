import type { RoleKey } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  username: string;
  role: RoleKey;
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: RoleKey;
}
