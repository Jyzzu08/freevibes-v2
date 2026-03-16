import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetKind, Prisma } from '@prisma/client';
import { createIncrementedSlug, createSlug } from '@/common/utils/slug.util';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadsService } from '@/uploads/uploads.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateArtistDto } from './dto/create-artist.dto';
import { CreateGenreDto } from './dto/create-genre.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async getBootstrap() {
    const [genres, artists, albums, tracks, imageAssets, audioAssets] =
      await Promise.all([
        this.prisma.genre.findMany({
          include: {
            coverAsset: true,
            _count: { select: { artists: true, albums: true, tracks: true } },
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.artist.findMany({
          include: {
            genre: true,
            heroAsset: true,
            _count: { select: { albums: true, tracks: true, followers: true } },
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.album.findMany({
          include: {
            artist: true,
            genre: true,
            coverAsset: true,
            _count: { select: { tracks: true, savedBy: true } },
          },
          orderBy: [{ releaseDate: 'desc' }, { title: 'asc' }],
        }),
        this.prisma.track.findMany({
          include: {
            artist: true,
            album: true,
            genre: true,
            audioAsset: true,
          },
          orderBy: [{ album: { title: 'asc' } }, { trackNumber: 'asc' }],
        }),
        this.prisma.uploadedAsset.findMany({
          where: { kind: AssetKind.IMAGE },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        this.prisma.uploadedAsset.findMany({
          where: { kind: AssetKind.AUDIO },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

    return {
      stats: {
        genres: genres.length,
        artists: artists.length,
        albums: albums.length,
        tracks: tracks.length,
      },
      genres: genres.map((genre) => this.serializeGenre(genre)),
      artists: artists.map((artist) => this.serializeArtist(artist)),
      albums: albums.map((album) => this.serializeAlbum(album)),
      tracks: tracks.map((track) => this.serializeTrack(track)),
      imageAssets: imageAssets.map((asset) => this.serializeAsset(asset)),
      audioAssets: audioAssets.map((asset) => this.serializeAsset(asset)),
    };
  }

  async createGenre(dto: CreateGenreDto) {
    const genre = await this.safeWrite(async () =>
      this.prisma.genre.create({
        data: {
          name: dto.name.trim(),
          slug: await this.generateUniqueSlug('genre', dto.name),
          description: dto.description?.trim() || null,
          coverAssetId: await this.resolveImageAssetId(dto.coverAssetId),
        },
        include: {
          coverAsset: true,
          _count: { select: { artists: true, albums: true, tracks: true } },
        },
      }),
    );

    return this.serializeGenre(genre);
  }

  async updateGenre(genreId: string, dto: UpdateGenreDto) {
    const existing = await this.prisma.genre.findUnique({
      where: { id: genreId },
    });

    if (!existing) {
      throw new NotFoundException('Genre not found');
    }

    const data: Prisma.GenreUncheckedUpdateInput = {};

    if (dto.name && dto.name.trim() !== existing.name) {
      data.name = dto.name.trim();
      data.slug = await this.generateUniqueSlug('genre', dto.name, genreId);
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.coverAssetId !== undefined) {
      data.coverAssetId = await this.resolveImageAssetId(dto.coverAssetId);
    }

    const genre = await this.safeWrite(() =>
      this.prisma.genre.update({
        where: { id: genreId },
        data,
        include: {
          coverAsset: true,
          _count: { select: { artists: true, albums: true, tracks: true } },
        },
      }),
    );

    return this.serializeGenre(genre);
  }

  async deleteGenre(genreId: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
      include: {
        _count: { select: { artists: true, albums: true, tracks: true } },
      },
    });

    if (!genre) {
      throw new NotFoundException('Genre not found');
    }

    if (genre._count.artists || genre._count.albums || genre._count.tracks) {
      throw new BadRequestException(
        'Genre cannot be deleted while it is referenced by artists, albums or tracks',
      );
    }

    await this.prisma.genre.delete({ where: { id: genreId } });
    return { success: true };
  }

  async createArtist(dto: CreateArtistDto) {
    await this.ensureGenre(dto.genreId);

    const artist = await this.safeWrite(async () =>
      this.prisma.artist.create({
        data: {
          name: dto.name.trim(),
          slug: await this.generateUniqueSlug('artist', dto.name),
          bio: dto.bio?.trim() || null,
          country: dto.country?.trim() || null,
          formedYear: dto.formedYear ?? null,
          genreId: dto.genreId,
          heroAssetId: await this.resolveImageAssetId(dto.heroAssetId),
        },
        include: {
          genre: true,
          heroAsset: true,
          _count: { select: { albums: true, tracks: true, followers: true } },
        },
      }),
    );

    return this.serializeArtist(artist);
  }

  async updateArtist(artistId: string, dto: UpdateArtistDto) {
    const existing = await this.prisma.artist.findUnique({
      where: { id: artistId },
    });

    if (!existing) {
      throw new NotFoundException('Artist not found');
    }

    if (dto.genreId) {
      await this.ensureGenre(dto.genreId);
    }

    const data: Prisma.ArtistUncheckedUpdateInput = {};

    if (dto.name && dto.name.trim() !== existing.name) {
      data.name = dto.name.trim();
      data.slug = await this.generateUniqueSlug('artist', dto.name, artistId);
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio?.trim() || null;
    }

    if (dto.country !== undefined) {
      data.country = dto.country?.trim() || null;
    }

    if (dto.formedYear !== undefined) {
      data.formedYear = dto.formedYear;
    }

    if (dto.genreId) {
      data.genreId = dto.genreId;
    }

    if (dto.heroAssetId !== undefined) {
      data.heroAssetId = await this.resolveImageAssetId(dto.heroAssetId);
    }

    const artist = await this.safeWrite(() =>
      this.prisma.artist.update({
        where: { id: artistId },
        data,
        include: {
          genre: true,
          heroAsset: true,
          _count: { select: { albums: true, tracks: true, followers: true } },
        },
      }),
    );

    return this.serializeArtist(artist);
  }

  async deleteArtist(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      include: { _count: { select: { albums: true, tracks: true } } },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    if (artist._count.albums || artist._count.tracks) {
      throw new BadRequestException(
        'Artist cannot be deleted while it still owns albums or tracks',
      );
    }

    await this.prisma.artist.delete({ where: { id: artistId } });
    return { success: true };
  }

  async createAlbum(dto: CreateAlbumDto) {
    const [artist] = await Promise.all([
      this.ensureArtist(dto.artistId),
      this.ensureGenre(dto.genreId),
    ]);

    const album = await this.safeWrite(async () =>
      this.prisma.album.create({
        data: {
          title: dto.title.trim(),
          slug: await this.generateUniqueSlug(
            'album',
            `${artist.name} ${dto.title}`,
          ),
          description: dto.description?.trim() || null,
          artistId: dto.artistId,
          genreId: dto.genreId,
          releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
          coverAssetId: await this.resolveImageAssetId(dto.coverAssetId),
        },
        include: {
          artist: true,
          genre: true,
          coverAsset: true,
          _count: { select: { tracks: true, savedBy: true } },
        },
      }),
    );

    return this.serializeAlbum(album);
  }

  async updateAlbum(albumId: string, dto: UpdateAlbumDto) {
    const existing = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { artist: true },
    });

    if (!existing) {
      throw new NotFoundException('Album not found');
    }

    const nextArtistId = dto.artistId ?? existing.artistId;

    if (dto.artistId) {
      await this.ensureArtist(dto.artistId);
    }
    if (dto.genreId) {
      await this.ensureGenre(dto.genreId);
    }

    const data: Prisma.AlbumUncheckedUpdateInput = {};

    if (dto.title && dto.title.trim() !== existing.title) {
      const artist = await this.ensureArtist(nextArtistId);
      data.title = dto.title.trim();
      data.slug = await this.generateUniqueSlug(
        'album',
        `${artist.name} ${dto.title}`,
        albumId,
      );
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.artistId) {
      data.artistId = dto.artistId;
    }

    if (dto.genreId) {
      data.genreId = dto.genreId;
    }

    if (dto.releaseDate !== undefined) {
      data.releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : null;
    }

    if (dto.coverAssetId !== undefined) {
      data.coverAssetId = await this.resolveImageAssetId(dto.coverAssetId);
    }

    const album = await this.safeWrite(() =>
      this.prisma.album.update({
        where: { id: albumId },
        data,
        include: {
          artist: true,
          genre: true,
          coverAsset: true,
          _count: { select: { tracks: true, savedBy: true } },
        },
      }),
    );

    return this.serializeAlbum(album);
  }

  async deleteAlbum(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { _count: { select: { tracks: true } } },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album._count.tracks) {
      throw new BadRequestException(
        'Album cannot be deleted while tracks still belong to it',
      );
    }

    await this.prisma.album.delete({ where: { id: albumId } });
    return { success: true };
  }

  async createTrack(dto: CreateTrackDto) {
    const [artist, album] = await Promise.all([
      this.ensureArtist(dto.artistId),
      this.ensureAlbum(dto.albumId),
      this.ensureGenre(dto.genreId),
    ]);

    if (album.artistId !== dto.artistId) {
      throw new BadRequestException(
        'Track artist must match the selected album artist',
      );
    }

    const track = await this.safeWrite(async () =>
      this.prisma.track.create({
        data: {
          title: dto.title.trim(),
          slug: await this.generateUniqueSlug(
            'track',
            `${artist.name} ${dto.title}`,
          ),
          trackNumber: dto.trackNumber,
          durationSec: dto.durationSec,
          artistId: dto.artistId,
          albumId: dto.albumId,
          genreId: dto.genreId,
          audioAssetId: await this.resolveAudioAssetId(dto.audioAssetId),
          isPublished: dto.isPublished ?? true,
        },
        include: {
          artist: true,
          album: true,
          genre: true,
          audioAsset: true,
        },
      }),
    );

    return this.serializeTrack(track);
  }

  async updateTrack(trackId: string, dto: UpdateTrackDto) {
    const existing = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true },
    });

    if (!existing) {
      throw new NotFoundException('Track not found');
    }

    const nextArtistId = dto.artistId ?? existing.artistId;
    const nextAlbumId = dto.albumId ?? existing.albumId;

    const [artist, album] = await Promise.all([
      this.ensureArtist(nextArtistId),
      this.ensureAlbum(nextAlbumId),
      dto.genreId ? this.ensureGenre(dto.genreId) : Promise.resolve(null),
    ]);

    if (album.artistId !== nextArtistId) {
      throw new BadRequestException(
        'Track artist must match the selected album artist',
      );
    }

    const data: Prisma.TrackUncheckedUpdateInput = {};

    if (dto.title && dto.title.trim() !== existing.title) {
      data.title = dto.title.trim();
      data.slug = await this.generateUniqueSlug(
        'track',
        `${artist.name} ${dto.title}`,
        trackId,
      );
    }

    if (dto.trackNumber !== undefined) {
      data.trackNumber = dto.trackNumber;
    }

    if (dto.durationSec !== undefined) {
      data.durationSec = dto.durationSec;
    }

    if (dto.artistId) {
      data.artistId = dto.artistId;
    }

    if (dto.albumId) {
      data.albumId = dto.albumId;
    }

    if (dto.genreId) {
      data.genreId = dto.genreId;
    }

    if (dto.audioAssetId !== undefined) {
      data.audioAssetId = await this.resolveAudioAssetId(dto.audioAssetId);
    }

    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }

    const track = await this.safeWrite(() =>
      this.prisma.track.update({
        where: { id: trackId },
        data,
        include: {
          artist: true,
          album: true,
          genre: true,
          audioAsset: true,
        },
      }),
    );

    return this.serializeTrack(track);
  }

  async deleteTrack(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    await this.prisma.track.delete({ where: { id: trackId } });
    return { success: true };
  }

  private async ensureGenre(genreId: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
    });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }
    return genre;
  }

  private async ensureArtist(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
    });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    return artist;
  }

  private async ensureAlbum(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });
    if (!album) {
      throw new NotFoundException('Album not found');
    }
    return album;
  }

  private async resolveImageAssetId(assetId?: string) {
    if (assetId === undefined) {
      return undefined;
    }

    if (!assetId) {
      return null;
    }

    return (await this.uploadsService.getAssetOrThrow(assetId, AssetKind.IMAGE))
      .id;
  }

  private async resolveAudioAssetId(assetId?: string) {
    if (assetId === undefined) {
      return undefined;
    }

    if (!assetId) {
      return null;
    }

    return (await this.uploadsService.getAssetOrThrow(assetId, AssetKind.AUDIO))
      .id;
  }

  private async generateUniqueSlug(
    model: 'genre' | 'artist' | 'album' | 'track',
    value: string,
    excludeId?: string,
  ) {
    const baseSlug = createSlug(value);

    if (!baseSlug) {
      throw new BadRequestException(
        'The provided value cannot generate a valid slug',
      );
    }

    for (let index = 0; index < 100; index += 1) {
      const slug = createIncrementedSlug(baseSlug, index);
      const existing = await this.findBySlug(model, slug, excludeId);

      if (!existing) {
        return slug;
      }
    }

    throw new ConflictException('Unable to generate a unique slug');
  }

  private findBySlug(
    model: 'genre' | 'artist' | 'album' | 'track',
    slug: string,
    excludeId?: string,
  ) {
    const where = {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    };

    switch (model) {
      case 'genre':
        return this.prisma.genre.findFirst({ where });
      case 'artist':
        return this.prisma.artist.findFirst({ where });
      case 'album':
        return this.prisma.album.findFirst({ where });
      case 'track':
        return this.prisma.track.findFirst({ where });
    }
  }

  private async safeWrite<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A record with the same unique value already exists',
          );
        }

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'The requested relationship is not valid',
          );
        }
      }

      throw error;
    }
  }

  private serializeGenre(genre: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverAssetId: string | null;
    updatedAt: Date;
    coverAsset?: { publicUrl: string } | null;
    _count?: { artists: number; albums: number; tracks: number };
  }) {
    return {
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      description: genre.description,
      coverAssetId: genre.coverAssetId,
      coverUrl: genre.coverAsset?.publicUrl ?? null,
      artistCount: genre._count?.artists ?? 0,
      albumCount: genre._count?.albums ?? 0,
      trackCount: genre._count?.tracks ?? 0,
      updatedAt: genre.updatedAt.toISOString(),
    };
  }

  private serializeArtist(artist: {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    country: string | null;
    formedYear: number | null;
    genreId: string;
    heroAssetId: string | null;
    updatedAt: Date;
    genre: { name: string };
    heroAsset?: { publicUrl: string } | null;
    _count?: { albums: number; tracks: number; followers: number };
  }) {
    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio,
      country: artist.country,
      formedYear: artist.formedYear,
      genreId: artist.genreId,
      genreName: artist.genre.name,
      heroAssetId: artist.heroAssetId,
      heroUrl: artist.heroAsset?.publicUrl ?? null,
      albumCount: artist._count?.albums ?? 0,
      trackCount: artist._count?.tracks ?? 0,
      followerCount: artist._count?.followers ?? 0,
      updatedAt: artist.updatedAt.toISOString(),
    };
  }

  private serializeAlbum(album: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    artistId: string;
    genreId: string;
    releaseDate: Date | null;
    coverAssetId: string | null;
    updatedAt: Date;
    artist: { name: string };
    genre: { name: string };
    coverAsset?: { publicUrl: string } | null;
    _count?: { tracks: number; savedBy: number };
  }) {
    return {
      id: album.id,
      title: album.title,
      slug: album.slug,
      description: album.description,
      artistId: album.artistId,
      artistName: album.artist.name,
      genreId: album.genreId,
      genreName: album.genre.name,
      releaseDate: album.releaseDate?.toISOString() ?? null,
      coverAssetId: album.coverAssetId,
      coverUrl: album.coverAsset?.publicUrl ?? null,
      trackCount: album._count?.tracks ?? 0,
      savedCount: album._count?.savedBy ?? 0,
      updatedAt: album.updatedAt.toISOString(),
    };
  }

  private serializeTrack(track: {
    id: string;
    title: string;
    slug: string;
    trackNumber: number;
    durationSec: number;
    artistId: string;
    albumId: string;
    genreId: string;
    audioAssetId: string | null;
    isPublished: boolean;
    updatedAt: Date;
    artist: { name: string };
    album: { title: string };
    genre: { name: string };
    audioAsset?: { publicUrl: string } | null;
  }) {
    return {
      id: track.id,
      title: track.title,
      slug: track.slug,
      trackNumber: track.trackNumber,
      durationSec: track.durationSec,
      artistId: track.artistId,
      artistName: track.artist.name,
      albumId: track.albumId,
      albumTitle: track.album.title,
      genreId: track.genreId,
      genreName: track.genre.name,
      audioAssetId: track.audioAssetId,
      audioUrl: track.audioAsset?.publicUrl ?? null,
      isPublished: track.isPublished,
      updatedAt: track.updatedAt.toISOString(),
    };
  }

  private serializeAsset(asset: {
    id: string;
    kind: AssetKind;
    originalName: string;
    publicUrl: string;
    sizeBytes: number;
    mimeType: string;
    createdAt: Date;
  }) {
    return {
      id: asset.id,
      kind: asset.kind,
      originalName: asset.originalName,
      publicUrl: asset.publicUrl,
      sizeBytes: asset.sizeBytes,
      mimeType: asset.mimeType,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
