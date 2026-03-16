import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CatalogQueryDto } from './dto/catalog-query.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listGenres(query: CatalogQueryDto) {
    const where: Prisma.GenreWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.genre.findMany({
        where,
        include: {
          coverAsset: true,
          _count: { select: { artists: true } },
        },
        skip: this.getSkip(query.page, query.limit),
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.genre.count({ where }),
    ]);

    return {
      items: items.map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
        coverUrl: genre.coverAsset?.publicUrl ?? null,
        artistCount: genre._count.artists,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async listArtists(query: CatalogQueryDto) {
    const where: Prisma.ArtistWhereInput = {
      ...(query.genre
        ? {
            genre: {
              OR: [
                { slug: query.genre },
                { name: { equals: query.genre, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { bio: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.artist.findMany({
        where,
        include: {
          genre: true,
          heroAsset: true,
        },
        skip: this.getSkip(query.page, query.limit),
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.artist.count({ where }),
    ]);

    return {
      items: items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        bio: artist.bio,
        country: artist.country,
        formedYear: artist.formedYear,
        genreName: artist.genre.name,
        imageUrl: artist.heroAsset?.publicUrl ?? null,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getArtist(slug: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      include: {
        genre: true,
        heroAsset: true,
        albums: {
          include: {
            coverAsset: true,
            _count: { select: { tracks: true } },
          },
          orderBy: { releaseDate: 'desc' },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return artist;
  }

  async listAlbums(query: CatalogQueryDto) {
    const where: Prisma.AlbumWhereInput = {
      ...(query.artistSlug ? { artist: { slug: query.artistSlug } } : {}),
      ...(query.genre
        ? {
            genre: {
              OR: [
                { slug: query.genre },
                { name: { equals: query.genre, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.album.findMany({
        where,
        include: {
          artist: true,
          genre: true,
          coverAsset: true,
        },
        skip: this.getSkip(query.page, query.limit),
        take: query.limit,
        orderBy: [{ releaseDate: 'desc' }, { title: 'asc' }],
      }),
      this.prisma.album.count({ where }),
    ]);

    return {
      items: items.map((album) => ({
        id: album.id,
        title: album.title,
        slug: album.slug,
        releaseDate: album.releaseDate?.toISOString() ?? null,
        genreName: album.genre.name,
        artistName: album.artist.name,
        coverUrl: album.coverAsset?.publicUrl ?? null,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAlbum(slug: string) {
    const album = await this.prisma.album.findUnique({
      where: { slug },
      include: {
        artist: true,
        genre: true,
        coverAsset: true,
        tracks: {
          include: {
            audioAsset: true,
            artist: true,
            album: true,
            genre: true,
          },
          orderBy: { trackNumber: 'asc' },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  async listTracks(query: CatalogQueryDto) {
    const where: Prisma.TrackWhereInput = {
      ...(query.albumSlug ? { album: { slug: query.albumSlug } } : {}),
      ...(query.artistSlug ? { artist: { slug: query.artistSlug } } : {}),
      ...(query.genre
        ? {
            genre: {
              OR: [
                { slug: query.genre },
                { name: { equals: query.genre, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { artist: { name: { contains: query.q, mode: 'insensitive' } } },
              { album: { title: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
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
        skip: this.getSkip(query.page, query.limit),
        take: query.limit,
        orderBy: [{ album: { releaseDate: 'desc' } }, { trackNumber: 'asc' }],
      }),
      this.prisma.track.count({ where }),
    ]);

    return {
      items: items.map((track) => ({
        id: track.id,
        title: track.title,
        slug: track.slug,
        durationSec: track.durationSec,
        trackNumber: track.trackNumber,
        genreName: track.genre.name,
        artistName: track.artist.name,
        albumTitle: track.album.title,
        coverUrl: track.album.coverAsset?.publicUrl ?? null,
        audioUrl: track.audioAsset?.publicUrl ?? null,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async listPublicPlaylists(query: CatalogQueryDto) {
    const where: Prisma.PlaylistWhereInput = {
      isPublic: true,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where,
        include: {
          coverAsset: true,
          user: {
            include: {
              profile: true,
            },
          },
          _count: { select: { tracks: true } },
        },
        skip: this.getSkip(query.page, query.limit),
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.playlist.count({ where }),
    ]);

    return {
      items: items.map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        slug: playlist.slug,
        description: playlist.description,
        isPublic: playlist.isPublic,
        coverUrl: playlist.coverAsset?.publicUrl ?? null,
        ownerName: playlist.user.profile?.displayName ?? playlist.user.username,
        trackCount: playlist._count.tracks,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getPublicPlaylist(slug: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: {
        slug,
        isPublic: true,
      },
      include: {
        coverAsset: true,
        user: {
          include: { profile: true },
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

    return playlist;
  }

  private getSkip(page: number, limit: number) {
    return Math.max(0, (page - 1) * limit);
  }
}
