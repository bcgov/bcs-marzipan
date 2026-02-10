import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no JWT required)
 * Use with JwtAuthGuard applied globally or on the controller
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
