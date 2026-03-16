import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleKey } from '@prisma/client';
import * as argon2 from 'argon2';
import type { Request } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtAccessPayload, JwtRefreshPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, request: Request) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already registered');
    }

    const role = await this.prisma.role.findUnique({
      where: { key: RoleKey.USER },
    });

    if (!role) {
      throw new UnauthorizedException('Default role not configured');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username,
        passwordHash: await argon2.hash(dto.password),
        roleId: role.id,
        profile: {
          create: {
            displayName: dto.displayName ?? dto.username,
          },
        },
      },
      include: {
        role: true,
        profile: true,
      },
    });

    return this.issueSession(user, request);
  }

  async login(dto: LoginDto, request: Request) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrUsername.toLowerCase() },
          { username: dto.emailOrUsername },
        ],
      },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user, request);
  }

  async refresh(rawRefreshToken: string | undefined, request: Request) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
      rawRefreshToken,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      },
    );

    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const matchedToken = await this.findMatchingRefreshToken(
      refreshTokens.map((token) => ({
        id: token.id,
        tokenHash: token.tokenHash,
      })),
      rawRefreshToken,
    );

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: {
        role: true,
        profile: true,
      },
    });

    return this.issueSession(user, request);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      return { success: true };
    }

    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
    });

    const matchedToken = await this.findMatchingRefreshToken(
      refreshTokens.map((token) => ({
        id: token.id,
        tokenHash: token.tokenHash,
      })),
      rawRefreshToken,
    );

    if (matchedToken) {
      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.key,
      profile: user.profile,
    };
  }

  getRefreshCookieName() {
    return (
      this.configService.get<string>('jwt.refreshCookieName') ??
      'freevibes_refresh_token'
    );
  }

  getRefreshCookieOptions() {
    const isSecureCookie =
      this.configService.get<string>('nodeEnv') === 'production' ||
      this.configService.get<boolean>('cookieSecure') === true;

    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isSecureCookie,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }

  private async issueSession(
    user: {
      id: string;
      email: string;
      username: string;
      role: { key: RoleKey };
      profile: {
        displayName: string;
        bio: string | null;
        country: string | null;
        avatarAssetId: string | null;
      } | null;
    },
    request: Request,
  ) {
    const accessSecret =
      this.configService.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const accessTtl = (this.configService.get<string>('jwt.accessTtl') ??
      '15m') as never;
    const refreshTtl = (this.configService.get<string>('jwt.refreshTtl') ??
      '30d') as never;

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role.key,
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtl,
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: request.headers['user-agent'] ?? null,
        ip: request.ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.key,
        profile: user.profile,
      },
    };
  }

  private async findMatchingRefreshToken(
    tokens: { id: string; tokenHash: string }[],
    rawToken: string,
  ) {
    for (const token of tokens) {
      if (await argon2.verify(token.tokenHash, rawToken)) {
        return token;
      }
    }

    return null;
  }
}
