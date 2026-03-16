import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from './auth.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto, request);
    response.cookie(
      this.authService.getRefreshCookieName(),
      session.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto, request);
    response.cookie(
      this.authService.getRefreshCookieName(),
      session.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName = this.authService.getRefreshCookieName();
    const cookies = request.cookies as Record<string, string> | undefined;
    const session = await this.authService.refresh(
      cookies?.[cookieName],
      request,
    );

    response.cookie(
      cookieName,
      session.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('logout')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName = this.authService.getRefreshCookieName();
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.authService.logout(cookies?.[cookieName]);
    response.clearCookie(cookieName, { path: '/' });
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser | undefined) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.getUserById(user.id);
  }
}
