import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [
      favoriteRows,
      savedAlbumRows,
      followedArtistRows,
      recentlyPlayedRows,
      historyRows,
      playlists,
    ] = await Promise.all([
      this.prisma.favoriteTrack.findMany({
        where: { userId },
        include: {
          track: {
            include: {
              artist: true,
              genre: true,
              album: {
                include: {
                  coverAsset: true,
                },
              },
              audioAsset: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedAlbum.findMany({
        where: { userId },
        include: {
          album: {
            include: {
              artist: true,
              genre: true,
              coverAsset: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.followedArtist.findMany({
        where: { userId },
        include: {
          artist: {
            include: {
              genre: true,
              heroAsset: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recentlyPlayed.findMany({
        where: { userId },
        include: {
          track: {
            include: {
              artist: true,
              genre: true,
              album: {
                include: {
                  coverAsset: true,
                },
              },
              audioAsset: true,
            },
          },
        },
        orderBy: { lastPlayedAt: 'desc' },
        take: 12,
      }),
      this.prisma.playbackHistory.findMany({
        where: { userId },
        include: {
          track: {
            include: {
              artist: true,
              album: {
                include: {
                  coverAsset: true,
                },
              },
              audioAsset: true,
            },
          },
        },
        orderBy: { playedAt: 'desc' },
        take: 20,
      }),
      this.prisma.playlist.findMany({
        where: { userId },
        include: {
          coverAsset: true,
          _count: { select: { tracks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      favoriteTrackIds: favoriteRows.map((row) => row.trackId),
      savedAlbumIds: savedAlbumRows.map((row) => row.albumId),
      followedArtistIds: followedArtistRows.map((row) => row.artistId),
      favoriteTracks: favoriteRows.map((row) => ({
        id: row.track.id,
        title: row.track.title,
        slug: row.track.slug,
        durationSec: row.track.durationSec,
        trackNumber: row.track.trackNumber,
        genreName: row.track.genre.name,
        artistName: row.track.artist.name,
        albumTitle: row.track.album.title,
        coverUrl: row.track.album.coverAsset?.publicUrl ?? null,
        audioUrl: row.track.audioAsset?.publicUrl ?? null,
      })),
      savedAlbums: savedAlbumRows.map((row) => ({
        id: row.album.id,
        title: row.album.title,
        slug: row.album.slug,
        releaseDate: row.album.releaseDate?.toISOString() ?? null,
        genreName: row.album.genre.name,
        artistName: row.album.artist.name,
        coverUrl: row.album.coverAsset?.publicUrl ?? null,
      })),
      followedArtists: followedArtistRows.map((row) => ({
        id: row.artist.id,
        name: row.artist.name,
        slug: row.artist.slug,
        bio: row.artist.bio,
        country: row.artist.country,
        formedYear: row.artist.formedYear,
        genreName: row.artist.genre.name,
        imageUrl: row.artist.heroAsset?.publicUrl ?? null,
      })),
      recentlyPlayed: recentlyPlayedRows.map((row) => ({
        id: row.track.id,
        title: row.track.title,
        slug: row.track.slug,
        durationSec: row.track.durationSec,
        trackNumber: row.track.trackNumber,
        genreName: row.track.genre.name,
        artistName: row.track.artist.name,
        albumTitle: row.track.album.title,
        coverUrl: row.track.album.coverAsset?.publicUrl ?? null,
        audioUrl: row.track.audioAsset?.publicUrl ?? null,
        lastPlayedAt: row.lastPlayedAt.toISOString(),
        playCount: row.playCount,
      })),
      playbackHistory: historyRows.map((row) => ({
        id: row.id,
        playedAt: row.playedAt.toISOString(),
        completed: row.completed,
        progressSeconds: row.progressSeconds,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        track: {
          id: row.track.id,
          title: row.track.title,
          artistName: row.track.artist.name,
          albumTitle: row.track.album.title,
          coverUrl: row.track.album.coverAsset?.publicUrl ?? null,
          audioUrl: row.track.audioAsset?.publicUrl ?? null,
          durationSec: row.track.durationSec,
        },
      })),
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        slug: playlist.slug,
        description: playlist.description,
        isPublic: playlist.isPublic,
        coverUrl: playlist.coverAsset?.publicUrl ?? null,
        trackCount: playlist._count.tracks,
        updatedAt: playlist.updatedAt.toISOString(),
      })),
    };
  }

  async favoriteTrack(userId: string, trackId: string) {
    await this.ensureTrack(trackId);
    await this.prisma.favoriteTrack.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
      update: {},
      create: {
        userId,
        trackId,
      },
    });

    return this.getOverview(userId);
  }

  async unfavoriteTrack(userId: string, trackId: string) {
    await this.prisma.favoriteTrack.deleteMany({
      where: {
        userId,
        trackId,
      },
    });

    return this.getOverview(userId);
  }

  async saveAlbum(userId: string, albumId: string) {
    await this.ensureAlbum(albumId);
    await this.prisma.savedAlbum.upsert({
      where: {
        userId_albumId: {
          userId,
          albumId,
        },
      },
      update: {},
      create: {
        userId,
        albumId,
      },
    });

    return this.getOverview(userId);
  }

  async unsaveAlbum(userId: string, albumId: string) {
    await this.prisma.savedAlbum.deleteMany({
      where: {
        userId,
        albumId,
      },
    });

    return this.getOverview(userId);
  }

  async followArtist(userId: string, artistId: string) {
    await this.ensureArtist(artistId);
    await this.prisma.followedArtist.upsert({
      where: {
        userId_artistId: {
          userId,
          artistId,
        },
      },
      update: {},
      create: {
        userId,
        artistId,
      },
    });

    return this.getOverview(userId);
  }

  async unfollowArtist(userId: string, artistId: string) {
    await this.prisma.followedArtist.deleteMany({
      where: {
        userId,
        artistId,
      },
    });

    return this.getOverview(userId);
  }

  private async ensureTrack(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
    });
    if (!track) {
      throw new NotFoundException('Track not found');
    }
  }

  private async ensureAlbum(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });
    if (!album) {
      throw new NotFoundException('Album not found');
    }
  }

  private async ensureArtist(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
    });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
  }
}
