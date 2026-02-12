import type { AuthUser } from '@corpcal/shared';

export interface AuthResponseDto {
  user: AuthUser;
  accessToken: string;
  expiresIn?: number;
}
