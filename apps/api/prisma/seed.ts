import {
  AssetKind,
  PrismaClient,
  RoleKey,
  StorageProvider,
  SourceType,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';

type LegacyGroup = {
  Nombre: string;
  Genero: string;
  Discos: {
    Disco: LegacyAlbum | LegacyAlbum[];
  };
};

type LegacyAlbum = {
  Titulo: string;
  FechaLanzamiento: string;
  DuracionTotal: string;
  Canciones: {
    Cancion: LegacyTrack | LegacyTrack[];
  };
};

type LegacyTrack = {
  Titulo: string;
  Duracion: string;
};

const prisma = new PrismaClient();
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

const genreDescriptionMap: Record<string, string> = {
  Pop: 'Melodias directas, luminosas y faciles de recordar.',
  House: 'Ritmos electronicos pensados para energia y movimiento.',
  Inspirador: 'Piezas elevadoras y cinematograficas para proyectos creativos.',
  Relajante: 'Capas atmosfericas para bajar revoluciones sin perder calidez.',
  Electrónica: 'Texturas digitales, sintetizadores y pulsos modernos.',
  Piano: 'Composiciones intimistas centradas en piano y espacio.',
  Jazz: 'Arreglos nocturnos, elegantes y organicos.',
  Clásica: 'Orquestacion solemne y dramatica con timbre clasico.',
  Indie: 'Cancion alternativa de acento emocional y personalidad propia.',
};

const genreImageMap: Record<string, string> = {
  Pop: 'Pop.jpg',
  House: 'House.jpg',
  Inspirador: 'Inspirador.jpg',
  Relajante: 'Relajante.jpg',
  Electrónica: 'Electronica.jpg',
  Piano: 'Piano.jpg',
  Jazz: 'Jazz.jpg',
  Clásica: 'Clasica.jpg',
  Indie: 'Indie.jpg',
};

const albumImageMap: Record<string, string> = {
  'Shining Stars': 'Pop.jpg',
  'Dancing Lights': 'Pop.jpg',
  'Deep Waves': 'House.jpg',
  'Bassline Groove': 'House.jpg',
  'Rise Up': 'riseup.jpg',
  'Dream Big': 'dreambig.jpg',
  'Dream On': 'dreambig.jpg',
  'Tranquil Waters': 'tranquil.jpg',
  'Silent Harmony': 'harmony.jpg',
  'Neon City': 'neoncity.jpg',
  'Circuit Break': 'circuit.jpg',
  'Peaceful Melody': 'peacefull.jpg',
  'Smooth Nights': 'smooth.jpg',
  'Late Night Blues': 'smooth.jpg',
  'Timeless Symphony': 'timeless.jpg',
  'Eternal Elegance': 'eternal.jpg',
  Wanderlust: 'wanderlust.jpg',
  'Echoes of Tomorrow': 'wanderlust.jpg',
};

const artistImageMap: Record<string, string> = {
  'Luna Smith': 'Pop.jpg',
  'DJ Sonic': 'evibes.jpg',
  'Emily Clarke': 'riseup.jpg',
  'Alex Bright': 'dreambig.jpg',
  'Ocean Breeze': 'tranquil.jpg',
  'Nature Bliss': 'harmony.jpg',
  'Electric Pulse': 'neoncity.jpg',
  'Sophie Keys': 'peacefull.jpg',
  'Jazz Collective': 'Jazzsociety.jpg',
  'Royal Strings': 'Legends.jpg',
  'Urban Nomad': 'indiewave.jpg',
};

const artistCountryMap: Record<string, string> = {
  'Luna Smith': 'Spain',
  'DJ Sonic': 'Netherlands',
  'Emily Clarke': 'United Kingdom',
  'Alex Bright': 'Canada',
  'Ocean Breeze': 'Portugal',
  'Nature Bliss': 'Iceland',
  'Electric Pulse': 'Germany',
  'Sophie Keys': 'France',
  'Jazz Collective': 'United States',
  'Royal Strings': 'Austria',
  'Urban Nomad': 'Australia',
};

const artistYearMap: Record<string, number> = {
  'Luna Smith': 2020,
  'DJ Sonic': 2018,
  'Emily Clarke': 2019,
  'Alex Bright': 2021,
  'Ocean Breeze': 2017,
  'Nature Bliss': 2016,
  'Electric Pulse': 2019,
  'Sophie Keys': 2015,
  'Jazz Collective': 2012,
  'Royal Strings': 2009,
  'Urban Nomad': 2022,
};

const audioFiles = [
  'golden-rise.wav',
  'night-drive.wav',
  'soft-horizon.wav',
  'pulse-city.wav',
  'moon-echo.wav',
  'warm-lights.wav',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resolveLegacyRoot() {
  const candidates = [
    process.env.LEGACY_ROOT,
    path.resolve(__dirname, '../../../assets/legacy-dataset'),
    '/freevibes-legacy',
    path.resolve(process.cwd(), '../freevibes-legacy'),
    path.resolve(process.cwd(), '../../freevibes-legacy'),
    path.resolve(__dirname, '../../../../freevibes-legacy'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      await fs.access(path.join(candidate, 'grupos.xml'));
      await fs.access(path.join(candidate, 'canciones.xml'));
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    `No se encontro el dataset legacy para el seed. Rutas probadas: ${candidates.join(', ')}`,
  );
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}

function durationToSeconds(value: string) {
  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
}

async function readLegacyData() {
  const legacyRoot = await resolveLegacyRoot();
  const [groupsXml, songsXml] = await Promise.all([
    fs.readFile(path.join(legacyRoot, 'grupos.xml'), 'utf-8'),
    fs.readFile(path.join(legacyRoot, 'canciones.xml'), 'utf-8'),
  ]);

  const groupsParsed = parser.parse(groupsXml) as {
    Grupos: { Grupo: LegacyGroup | LegacyGroup[] };
  };
  const songsParsed = parser.parse(songsXml) as {
    Discos: { Disco: LegacyAlbum | LegacyAlbum[] };
  };

  return {
    groups: toArray(groupsParsed.Grupos.Grupo),
    songAlbums: toArray(songsParsed.Discos.Disco),
  };
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.recentlyPlayed.deleteMany(),
    prisma.playbackHistory.deleteMany(),
    prisma.favoriteTrack.deleteMany(),
    prisma.savedAlbum.deleteMany(),
    prisma.followedArtist.deleteMany(),
    prisma.playlistTrack.deleteMany(),
    prisma.playlist.deleteMany(),
    prisma.track.deleteMany(),
    prisma.album.deleteMany(),
    prisma.artist.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.uploadedAsset.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);
}

async function shouldSkipSeed() {
  if (process.env.SEED_FORCE_RESET === 'true') {
    return false;
  }

  const [roleCount, artistCount, userCount] = await Promise.all([
    prisma.role.count(),
    prisma.artist.count(),
    prisma.user.count(),
  ]);

  return roleCount > 0 || artistCount > 0 || userCount > 0;
}

async function main() {
  if (await shouldSkipSeed()) {
    console.log(
      'Seed omitido: la base de datos ya contiene datos. Usa SEED_FORCE_RESET=true para reconstruir el demo dataset.',
    );
    return;
  }

  if (process.env.SEED_FORCE_RESET === 'true') {
    await resetDatabase();
  }

  const { groups, songAlbums } = await readLegacyData();

  const adminRole = await prisma.role.create({
    data: { key: RoleKey.ADMIN, name: 'Administrator' },
  });
  const userRole = await prisma.role.create({
    data: { key: RoleKey.USER, name: 'User' },
  });

  const [adminUser, demoUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@freevibes.local',
        username: 'freevibes_admin',
        passwordHash: await argon2.hash('FreevibesAdmin123!'),
        roleId: adminRole.id,
        profile: {
          create: {
            displayName: 'FreeVibes Admin',
            bio: 'Curando el catalogo demo de FreeVibes 2.0.',
            country: 'Spain',
          },
        },
      },
      include: { profile: true },
    }),
    prisma.user.create({
      data: {
        email: 'listener@freevibes.local',
        username: 'listener_demo',
        passwordHash: await argon2.hash('FreevibesUser123!'),
        roleId: userRole.id,
        profile: {
          create: {
            displayName: 'Legacy Listener',
            bio: 'Explorando la evolucion de FreeVibes.',
            country: 'Spain',
          },
        },
      },
      include: { profile: true },
    }),
  ]);

  const assetMap = new Map<string, { id: string; publicUrl: string }>();

  async function ensureAsset(
    filename: string,
    kind: AssetKind,
    ownerType: string,
  ) {
    if (assetMap.has(filename)) {
      return assetMap.get(filename)!;
    }

    const asset = await prisma.uploadedAsset.create({
      data: {
        kind,
        provider: StorageProvider.LOCAL,
        originalName: filename,
        storagePath:
          kind === AssetKind.AUDIO
            ? `/audio/demo/${filename}`
            : `/legacy/${filename}`,
        publicUrl:
          kind === AssetKind.AUDIO
            ? `/audio/demo/${filename}`
            : `/legacy/${filename}`,
        mimeType: kind === AssetKind.AUDIO ? 'audio/wav' : 'image/jpeg',
        sizeBytes: 1,
        ownerType,
        uploadedById: adminUser.id,
      },
    });

    const payload = { id: asset.id, publicUrl: asset.publicUrl };
    assetMap.set(filename, payload);
    return payload;
  }

  const genreRecords = new Map<string, { id: string; slug: string }>();
  for (const genreName of Array.from(
    new Set(groups.map((group) => group.Genero)),
  )) {
    const coverAsset = await ensureAsset(
      genreImageMap[genreName],
      AssetKind.IMAGE,
      'genre',
    );
    const genre = await prisma.genre.create({
      data: {
        name: genreName,
        slug: toSlug(genreName),
        description: genreDescriptionMap[genreName],
        coverAssetId: coverAsset.id,
      },
    });
    genreRecords.set(genreName, { id: genre.id, slug: genre.slug });
  }

  const audioAssets = await Promise.all(
    audioFiles.map((filename) =>
      ensureAsset(filename, AssetKind.AUDIO, 'track'),
    ),
  );

  const albumTrackLookup = new Map(
    songAlbums.map((album) => [
      album.Titulo,
      {
        releaseDate: album.FechaLanzamiento,
        tracks: toArray(album.Canciones.Cancion),
      },
    ]),
  );

  const artistRecords = new Map<string, { id: string }>();
  const albumRecords: string[] = [];
  const trackRecords: string[] = [];

  let audioPointer = 0;
  for (const group of groups) {
    const heroAsset = await ensureAsset(
      artistImageMap[group.Nombre] ?? genreImageMap[group.Genero],
      AssetKind.IMAGE,
      'artist',
    );

    const artist = await prisma.artist.create({
      data: {
        name: group.Nombre,
        slug: toSlug(group.Nombre),
        bio: `${group.Nombre} representa la faceta ${group.Genero.toLowerCase()} del universo FreeVibes.`,
        country: artistCountryMap[group.Nombre] ?? 'Spain',
        formedYear: artistYearMap[group.Nombre] ?? 2020,
        genreId: genreRecords.get(group.Genero)!.id,
        heroAssetId: heroAsset.id,
      },
    });
    artistRecords.set(group.Nombre, { id: artist.id });

    for (const legacyAlbum of toArray(group.Discos.Disco)) {
      const albumCover = await ensureAsset(
        albumImageMap[legacyAlbum.Titulo] ?? genreImageMap[group.Genero],
        AssetKind.IMAGE,
        'album',
      );
      const album = await prisma.album.create({
        data: {
          title: legacyAlbum.Titulo,
          slug: toSlug(legacyAlbum.Titulo),
          description: `${legacyAlbum.Titulo} extiende la atmosfera ${group.Genero.toLowerCase()} de ${group.Nombre}.`,
          artistId: artist.id,
          genreId: genreRecords.get(group.Genero)!.id,
          releaseDate: new Date(
            albumTrackLookup.get(legacyAlbum.Titulo)?.releaseDate ??
              legacyAlbum.FechaLanzamiento,
          ),
          coverAssetId: albumCover.id,
        },
      });

      albumRecords.push(album.id);

      const trackSource =
        albumTrackLookup.get(legacyAlbum.Titulo)?.tracks ??
        toArray(legacyAlbum.Canciones.Cancion);

      let trackNumber = 1;
      for (const legacyTrack of trackSource) {
        const track = await prisma.track.create({
          data: {
            title: legacyTrack.Titulo,
            slug: `${toSlug(legacyTrack.Titulo)}-${toSlug(group.Nombre)}`,
            trackNumber,
            durationSec: durationToSeconds(legacyTrack.Duracion),
            artistId: artist.id,
            albumId: album.id,
            genreId: genreRecords.get(group.Genero)!.id,
            audioAssetId: audioAssets[audioPointer % audioAssets.length].id,
          },
        });

        trackRecords.push(track.id);
        trackNumber += 1;
        audioPointer += 1;
      }
    }
  }

  const playlistCover = await ensureAsset(
    'FreeVibes.jpg',
    AssetKind.IMAGE,
    'playlist',
  );
  const firstSixTracks = await prisma.track.findMany({
    take: 6,
    orderBy: { createdAt: 'asc' },
  });
  const lastSixTracks = await prisma.track.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const [adminPlaylist, listenerPlaylist] = await Promise.all([
    prisma.playlist.create({
      data: {
        userId: adminUser.id,
        title: 'Legacy Highlights',
        slug: 'legacy-highlights',
        description: 'Una seleccion curada a partir del catalogo XML original.',
        isPublic: true,
        coverAssetId: playlistCover.id,
      },
    }),
    prisma.playlist.create({
      data: {
        userId: demoUser.id,
        title: 'Night Drive Picks',
        slug: 'night-drive-picks',
        description:
          'House, jazz e indie para probar la experiencia FreeVibes 2.0.',
        isPublic: true,
        coverAssetId: playlistCover.id,
      },
    }),
  ]);

  for (const [index, track] of firstSixTracks.entries()) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: adminPlaylist.id,
        trackId: track.id,
        position: index + 1,
      },
    });
  }

  for (const [index, track] of lastSixTracks.entries()) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: listenerPlaylist.id,
        trackId: track.id,
        position: index + 1,
      },
    });
  }

  const firstArtist = await prisma.artist.findFirstOrThrow();
  const firstAlbum = await prisma.album.findFirstOrThrow();
  const firstTrack = await prisma.track.findFirstOrThrow();

  await Promise.all([
    prisma.followedArtist.create({
      data: { userId: demoUser.id, artistId: firstArtist.id },
    }),
    prisma.savedAlbum.create({
      data: { userId: demoUser.id, albumId: firstAlbum.id },
    }),
    prisma.favoriteTrack.create({
      data: { userId: demoUser.id, trackId: firstTrack.id },
    }),
    prisma.playbackHistory.create({
      data: {
        userId: demoUser.id,
        trackId: firstTrack.id,
        sourceType: SourceType.HOME,
        completed: true,
        progressSeconds: firstTrack.durationSec,
      },
    }),
    prisma.recentlyPlayed.create({
      data: {
        userId: demoUser.id,
        trackId: firstTrack.id,
        playCount: 2,
      },
    }),
  ]);

  console.log(
    `Seed completado: ${genreRecords.size} generos, ${artistRecords.size} artistas, ${albumRecords.length} albumes, ${trackRecords.length} tracks.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
