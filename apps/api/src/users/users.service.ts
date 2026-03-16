import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.serializeUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          displayName: dto.displayName?.trim() || user.profile.displayName,
          bio: dto.bio?.trim() || null,
          country: dto.country?.trim() || null,
        },
      });
    } else {
      await this.prisma.profile.create({
        data: {
          userId,
          displayName: dto.displayName?.trim() || user.username,
          bio: dto.bio?.trim() || null,
          country: dto.country?.trim() || null,
        },
      });
    }

    return this.getMe(userId);
  }

  private serializeUser(user: {
    id: string;
    email: string;
    username: string;
    role: { key: string };
    profile: {
      displayName: string;
      bio: string | null;
      country: string | null;
    } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.key,
      profile: user.profile,
    };
  }
}
