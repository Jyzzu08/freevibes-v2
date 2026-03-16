import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetKind } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadsService } from '@/uploads/uploads.service';
import { createIncrementedSlug, createSlug } from '@/common/utils/slug.util';
import type { CreatePlaylistDto } from './dto/create-playlist.dto';
import type { UpdatePlaylistDto } from './dto/update-playlist.dto';
import type { AddPlaylistTrackDto } from './dto/add-playlist-track.dto';
import type { ReorderPlaylistTracksDto } from './dto/reorder-playlist-tracks.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async listMine(userId: string) {
    const playlists = await this.prisma.playlist.findMany({
      where: { userId },
      include: {
        coverAsset: true,
        _count: { select: { tracks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return playlists.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      slug: playlist.slug,
      description: playlist.description,
      isPublic: playlist.isPublic,
      coverUrl: playlist.coverAsset?.publicUrl ?? null,
      trackCount: playlist._count.tracks,
      updatedAt: playlist.updatedAt.toISOString(),
    }));
  }

  async getBySlug(slug: string, userId?: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { slug },
      include: {
        coverAsset: true,
        user: {
          include: {
            profile: true,
          },
        },
        tracks: {
          include: {
            track: {
              include: {
                artist: true,
                album: {
                  include: {
                    coverAsset: true,
                  },
                },
                genre: true,
                audioAsset: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    const isOwner = playlist.userId === userId;

    if (!playlist.isPublic && !isOwner) {
      throw new ForbiddenException('This playlist is private');
    }

    return {
      id: playlist.id,
      title: playlist.title,
      slug: playlist.slug,
      description: playlist.description,
      isPublic: playlist.isPublic,
      canEdit: isOwner,
      coverAssetId: playlist.coverAssetId,
      coverAsset: playlist.coverAsset
        ? {
            id: playlist.coverAsset.id,
            publicUrl: playlist.coverAsset.publicUrl,
          }
        : null,
      owner: {
        id: playlist.user.id,
        username: playlist.user.username,
        displayName:
          playlist.user.profile?.displayName ?? playlist.user.username,
      },
      tracks: playlist.tracks.map((row) => ({
        id: row.id,
        position: row.position,
        track: {
          id: row.track.id,
          title: row.track.title,
          durationSec: row.track.durationSec,
          trackNumber: row.track.trackNumber,
          artist: { id: row.track.artist.id, name: row.track.artist.name },
          album: {
            id: row.track.album.id,
            title: row.track.album.title,
            coverAsset: row.track.album.coverAsset
              ? { publicUrl: row.track.album.coverAsset.publicUrl }
              : null,
          },
          genre: { id: row.track.genre.id, name: row.track.genre.name },
          audioAsset: row.track.audioAsset
            ? { publicUrl: row.track.audioAsset.publicUrl }
            : null,
        },
      })),
    };
  }

  async create(userId: string, dto: CreatePlaylistDto) {
    const coverAssetId = dto.coverAssetId
      ? (
          await this.uploadsService.getAssetOrThrow(
            dto.coverAssetId,
            AssetKind.IMAGE,
          )
        ).id
      : null;

    const slug = await this.generateUniqueSlug(dto.title);
    const playlist = await this.prisma.playlist.create({
      data: {
        userId,
        title: dto.title.trim(),
        slug,
        description: dto.description?.trim() || null,
        isPublic: dto.isPublic ?? false,
        coverAssetId,
      },
    });

    return this.getBySlug(playlist.slug, userId);
  }

  async update(playlistId: string, userId: string, dto: UpdatePlaylistDto) {
    const playlist = await this.getOwnedPlaylist(playlistId, userId);

    const data: {
      title?: string;
      slug?: string;
      description?: string | null;
      isPublic?: boolean;
      coverAssetId?: string | null;
    } = {};

    if (dto.title && dto.title.trim() !== playlist.title) {
      data.title = dto.title.trim();
      data.slug = await this.generateUniqueSlug(dto.title, playlistId);
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.isPublic !== undefined) {
      data.isPublic = dto.isPublic;
    }

    if (dto.coverAssetId !== undefined) {
      data.coverAssetId = dto.coverAssetId
        ? (
            await this.uploadsService.getAssetOrThrow(
              dto.coverAssetId,
              AssetKind.IMAGE,
            )
          ).id
        : null;
    }

    await this.prisma.playlist.update({
      where: { id: playlist.id },
      data,
    });

    return this.getBySlug(data.slug ?? playlist.slug, userId);
  }

  async delete(playlistId: string, userId: string) {
    const playlist = await this.getOwnedPlaylist(playlistId, userId);

    await this.prisma.playlist.delete({
      where: { id: playlist.id },
    });

    return { success: true };
  }

  async addTrack(playlistId: string, userId: string, dto: AddPlaylistTrackDto) {
    const playlist = await this.getOwnedPlaylist(playlistId, userId);
    const track = await this.prisma.track.findUnique({
      where: { id: dto.trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    const existing = await this.prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId: dto.trackId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Track already exists in this playlist');
    }

    const positionAggregate = await this.prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });

    await this.prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId: dto.trackId,
        position: (positionAggregate._max.position ?? 0) + 1,
      },
    });

    return this.getBySlug(playlist.slug, userId);
  }

  async removeTrack(playlistId: string, trackId: string, userId: string) {
    const playlist = await this.getOwnedPlaylist(playlistId, userId);
    const row = await this.prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Track is not part of this playlist');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playlistTrack.delete({
        where: { id: row.id },
      });

      const remaining = await tx.playlistTrack.findMany({
        where: { playlistId },
        orderBy: { position: 'asc' },
      });

      for (const [index, item] of remaining.entries()) {
        await tx.playlistTrack.update({
          where: { id: item.id },
          data: { position: index + 1 },
        });
      }
    });

    return this.getBySlug(playlist.slug, userId);
  }

  async reorderTracks(
    playlistId: string,
    userId: string,
    dto: ReorderPlaylistTracksDto,
  ) {
    const playlist = await this.getOwnedPlaylist(playlistId, userId);
    const rows = await this.prisma.playlistTrack.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
    });

    if (rows.length !== dto.trackIds.length) {
      throw new BadRequestException(
        'Track order must include all tracks in the playlist',
      );
    }

    const currentIds = new Set(rows.map((row) => row.trackId));
    if (!dto.trackIds.every((trackId) => currentIds.has(trackId))) {
      throw new BadRequestException('Track order contains invalid tracks');
    }

    await this.prisma.$transaction(async (tx) => {
      const tempOffset = rows.length + 1;

      // Move every row out of the final range first to avoid unique collisions.
      for (const [index, row] of rows.entries()) {
        await tx.playlistTrack.update({
          where: { id: row.id },
          data: {
            position: tempOffset + index,
          },
        });
      }

      for (const [index, trackId] of dto.trackIds.entries()) {
        await tx.playlistTrack.update({
          where: {
            playlistId_trackId: {
              playlistId,
              trackId,
            },
          },
          data: {
            position: index + 1,
          },
        });
      }
    });

    return this.getBySlug(playlist.slug, userId);
  }

  private async getOwnedPlaylist(playlistId: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You cannot modify this playlist');
    }

    return playlist;
  }

  private async generateUniqueSlug(title: string, excludeId?: string) {
    const baseSlug = createSlug(title);

    if (!baseSlug) {
      throw new BadRequestException(
        'Playlist title must generate a valid slug',
      );
    }

    for (let index = 0; index < 100; index += 1) {
      const slug = createIncrementedSlug(baseSlug, index);
      const existing = await this.prisma.playlist.findFirst({
        where: {
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }
    }

    throw new ConflictException('Unable to generate a unique playlist slug');
  }
}
