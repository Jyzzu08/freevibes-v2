import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { RecordPlaybackDto } from './dto/record-playback.dto';

@Injectable()
export class PlaybackService {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, dto: RecordPlaybackDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: dto.trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    const progressSeconds = Math.min(
      dto.progressSeconds ?? 0,
      track.durationSec,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const history = await tx.playbackHistory.create({
        data: {
          userId,
          trackId: dto.trackId,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId ?? null,
          completed: dto.completed ?? false,
          progressSeconds,
        },
      });

      const recent = await tx.recentlyPlayed.upsert({
        where: {
          userId_trackId: {
            userId,
            trackId: dto.trackId,
          },
        },
        update: {
          lastPlayedAt: new Date(),
          playCount: {
            increment: 1,
          },
        },
        create: {
          userId,
          trackId: dto.trackId,
          playCount: 1,
        },
      });

      return {
        history,
        recent,
      };
    });

    return {
      success: true,
      historyId: result.history.id,
      recentlyPlayedId: result.recent.id,
    };
  }
}
