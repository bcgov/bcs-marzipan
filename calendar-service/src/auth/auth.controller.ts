import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { loginBodySchema } from './dto/login.dto';
import { ACCESS_TOKEN_COOKIE, type AuthUser } from '@corpcal/shared';

/** Cookie name for JWT access token */
const ACCESS_TOKEN_COOKIE = 'access_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate and receive JWT (mock: use username only)',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = loginBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message ?? 'Invalid request');
    }
    const result = await this.authService.login(parsed.data);

    // Set httpOnly cookie with JWT for browser authentication
    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: (result.expiresIn ?? 3600) * 1000,
    });

    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current user',
    description: 'Get current user and permissions',
  })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Log out and clear auth cookie',
  })
  @ApiResponse({ status: 200, description: 'Logged out' })
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the httpOnly auth cookie
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return this.authService.logout();
  }

  // TODO: Implement refresh token.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Not implemented; re-login to get new token',
  })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  refresh() {
    return this.authService.refresh();
  }
}
