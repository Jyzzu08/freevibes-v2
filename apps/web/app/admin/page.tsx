'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Shield, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ApiError,
  createAdminAlbum,
  createAdminArtist,
  createAdminGenre,
  createAdminTrack,
  deleteAdminAlbum,
  deleteAdminArtist,
  deleteAdminGenre,
  deleteAdminTrack,
  getAdminBootstrap,
  type AdminBootstrap,
  updateAdminAlbum,
  updateAdminArtist,
  updateAdminGenre,
  updateAdminTrack,
  uploadAudio,
  uploadImage,
} from '@/lib/api';
import { useSessionStore } from '@/store/session-store';

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

export default function AdminPage() {
  const user = useSessionStore((state) => state.user);
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');

  const [genreForm, setGenreForm] = useState({
    name: '',
    description: '',
    coverAssetId: '',
  });
  const [artistForm, setArtistForm] = useState({
    name: '',
    genreId: '',
    bio: '',
    country: '',
    formedYear: '',
    heroAssetId: '',
  });
  const [albumForm, setAlbumForm] = useState({
    title: '',
    artistId: '',
    genreId: '',
    description: '',
    releaseDate: '',
    coverAssetId: '',
  });
  const [trackForm, setTrackForm] = useState({
    title: '',
    trackNumber: '',
    durationSec: '',
    artistId: '',
    albumId: '',
    genreId: '',
    audioAssetId: '',
    isPublished: true,
  });

  const imageAssets = bootstrap?.imageAssets ?? [];
  const audioAssets = bootstrap?.audioAssets ?? [];

  const selectedGenre = useMemo(
    () => bootstrap?.genres.find((genre) => genre.id === selectedGenreId) ?? null,
    [bootstrap?.genres, selectedGenreId],
  );
  const selectedArtist = useMemo(
    () => bootstrap?.artists.find((artist) => artist.id === selectedArtistId) ?? null,
    [bootstrap?.artists, selectedArtistId],
  );
  const selectedAlbum = useMemo(
    () => bootstrap?.albums.find((album) => album.id === selectedAlbumId) ?? null,
    [bootstrap?.albums, selectedAlbumId],
  );
  const selectedTrack = useMemo(
    () => bootstrap?.tracks.find((track) => track.id === selectedTrackId) ?? null,
    [bootstrap?.tracks, selectedTrackId],
  );

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    void loadBootstrap();
  }, [user?.role]);

  useEffect(() => {
    if (!selectedGenre) {
      setGenreForm({ name: '', description: '', coverAssetId: '' });
      return;
    }

    setGenreForm({
      name: selectedGenre.name,
      description: selectedGenre.description ?? '',
      coverAssetId: selectedGenre.coverAssetId ?? '',
    });
  }, [selectedGenre]);

  useEffect(() => {
    if (!selectedArtist) {
      setArtistForm({
        name: '',
        genreId: '',
        bio: '',
        country: '',
        formedYear: '',
        heroAssetId: '',
      });
      return;
    }

    setArtistForm({
      name: selectedArtist.name,
      genreId: selectedArtist.genreId,
      bio: selectedArtist.bio ?? '',
      country: selectedArtist.country ?? '',
      formedYear: selectedArtist.formedYear?.toString() ?? '',
      heroAssetId: selectedArtist.heroAssetId ?? '',
    });
  }, [selectedArtist]);

  useEffect(() => {
    if (!selectedAlbum) {
      setAlbumForm({
        title: '',
        artistId: '',
        genreId: '',
        description: '',
        releaseDate: '',
        coverAssetId: '',
      });
      return;
    }

    setAlbumForm({
      title: selectedAlbum.title,
      artistId: selectedAlbum.artistId,
      genreId: selectedAlbum.genreId,
      description: selectedAlbum.description ?? '',
      releaseDate: toDateInputValue(selectedAlbum.releaseDate),
      coverAssetId: selectedAlbum.coverAssetId ?? '',
    });
  }, [selectedAlbum]);

  useEffect(() => {
    if (!selectedTrack) {
      setTrackForm({
        title: '',
        trackNumber: '',
        durationSec: '',
        artistId: '',
        albumId: '',
        genreId: '',
        audioAssetId: '',
        isPublished: true,
      });
      return;
    }

    setTrackForm({
      title: selectedTrack.title,
      trackNumber: selectedTrack.trackNumber.toString(),
      durationSec: selectedTrack.durationSec.toString(),
      artistId: selectedTrack.artistId,
      albumId: selectedTrack.albumId,
      genreId: selectedTrack.genreId,
      audioAssetId: selectedTrack.audioAssetId ?? '',
      isPublished: selectedTrack.isPublished,
    });
  }, [selectedTrack]);

  async function loadBootstrap() {
    try {
      setIsLoading(true);
      const nextBootstrap = await getAdminBootstrap();
      setBootstrap(nextBootstrap);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError ? loadError.message : 'No se pudo cargar el panel admin.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function runAdminAction(action: () => Promise<unknown>) {
    try {
      await action();
      await loadBootstrap();
    } catch (actionError) {
      setError(
        actionError instanceof ApiError
          ? actionError.message
          : 'No se pudo completar la accion admin.',
      );
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <AppShell
        title="Admin"
        description="El panel completo de gestion queda reservado al rol admin."
      >
        <Card className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Acceso restringido
          </p>
          <h2 className="mt-3 font-display text-3xl">Modo solo lectura</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            Entra con `admin@freevibes.local / FreevibesAdmin123!` para usar el CRUD real de
            artistas, albums, tracks, generos y uploads.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Admin"
      description="CRUD real del catalogo musical, uploads locales y gestion de assets listos para portfolio."
    >
      {error ? (
        <Card className="mb-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Estado actual
              </p>
              <h2 className="mt-3 font-display text-3xl">Panel operativo</h2>
            </div>
            <Shield className="h-7 w-7 text-[var(--color-accent)]" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <p className="text-2xl font-semibold">{bootstrap?.stats.genres ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Generos</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <p className="text-2xl font-semibold">{bootstrap?.stats.artists ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Artistas</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <p className="text-2xl font-semibold">{bootstrap?.stats.albums ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Albums</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <p className="text-2xl font-semibold">{bootstrap?.stats.tracks ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Tracks</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void loadBootstrap()}>
              {isLoading ? 'Actualizando...' : 'Refrescar datos'}
            </Button>
            <Button asChild>
              <Link href="http://localhost:3001/docs" target="_blank">
                Swagger
              </Link>
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Uploads
              </p>
              <h2 className="mt-3 font-display text-3xl">Assets locales</h2>
            </div>
            <Upload className="h-7 w-7 text-[var(--color-accent)]" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-[28px] border border-white/10 bg-black/25 p-4 text-sm">
              <p className="font-medium">Subir portada</p>
              <p className="mt-2 text-[var(--color-muted)]">JPG, PNG o WEBP hasta 5MB.</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-4 block w-full text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setIsUploadingImage(true);
                  void runAdminAction(async () => {
                    await uploadImage(file);
                  }).finally(() => setIsUploadingImage(false));
                }}
              />
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {isUploadingImage ? 'Subiendo imagen...' : `${imageAssets.length} imagenes listas`}
              </p>
            </label>
            <label className="rounded-[28px] border border-white/10 bg-black/25 p-4 text-sm">
              <p className="font-medium">Subir audio demo</p>
              <p className="mt-2 text-[var(--color-muted)]">MP3, WAV u OGG hasta 25MB.</p>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                className="mt-4 block w-full text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setIsUploadingAudio(true);
                  void runAdminAction(async () => {
                    await uploadAudio(file);
                  }).finally(() => setIsUploadingAudio(false));
                }}
              />
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {isUploadingAudio ? 'Subiendo audio...' : `${audioAssets.length} audios listos`}
              </p>
            </label>
          </div>
        </Card>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-display text-3xl">Generos</h2>
          <div className="mt-5 space-y-4">
            <Select
              value={selectedGenreId}
              onChange={(event) => setSelectedGenreId(event.target.value)}
            >
              <option value="">Crear nuevo genero</option>
              {bootstrap?.genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </Select>
            <Input
              value={genreForm.name}
              onChange={(event) =>
                setGenreForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nombre del genero"
            />
            <Textarea
              value={genreForm.description}
              onChange={(event) =>
                setGenreForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Descripcion"
            />
            <Select
              value={genreForm.coverAssetId}
              onChange={(event) =>
                setGenreForm((current) => ({
                  ...current,
                  coverAssetId: event.target.value,
                }))
              }
            >
              <option value="">Sin portada asociada</option>
              {imageAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.originalName}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void runAdminAction(async () => {
                    if (selectedGenreId) {
                      await updateAdminGenre(selectedGenreId, {
                        name: genreForm.name,
                        description: genreForm.description,
                        coverAssetId: genreForm.coverAssetId || null,
                      });
                    } else {
                      await createAdminGenre({
                        name: genreForm.name,
                        description: genreForm.description,
                        coverAssetId: genreForm.coverAssetId || undefined,
                      });
                    }
                  })
                }
              >
                {selectedGenreId ? 'Guardar genero' : 'Crear genero'}
              </Button>
              {selectedGenreId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAdminAction(async () => {
                      await deleteAdminGenre(selectedGenreId);
                      setSelectedGenreId('');
                    })
                  }
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-3xl">Artistas</h2>
          <div className="mt-5 space-y-4">
            <Select
              value={selectedArtistId}
              onChange={(event) => setSelectedArtistId(event.target.value)}
            >
              <option value="">Crear nuevo artista</option>
              {bootstrap?.artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </Select>
            <Input
              value={artistForm.name}
              onChange={(event) =>
                setArtistForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nombre del artista"
            />
            <Select
              value={artistForm.genreId}
              onChange={(event) =>
                setArtistForm((current) => ({ ...current, genreId: event.target.value }))
              }
            >
              <option value="">Selecciona genero</option>
              {bootstrap?.genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </Select>
            <Textarea
              value={artistForm.bio}
              onChange={(event) =>
                setArtistForm((current) => ({ ...current, bio: event.target.value }))
              }
              placeholder="Bio"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={artistForm.country}
                onChange={(event) =>
                  setArtistForm((current) => ({
                    ...current,
                    country: event.target.value,
                  }))
                }
                placeholder="Pais"
              />
              <Input
                type="number"
                value={artistForm.formedYear}
                onChange={(event) =>
                  setArtistForm((current) => ({
                    ...current,
                    formedYear: event.target.value,
                  }))
                }
                placeholder="Ano de formacion"
              />
            </div>
            <Select
              value={artistForm.heroAssetId}
              onChange={(event) =>
                setArtistForm((current) => ({
                  ...current,
                  heroAssetId: event.target.value,
                }))
              }
            >
              <option value="">Sin imagen hero</option>
              {imageAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.originalName}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void runAdminAction(async () => {
                    const payload = {
                      name: artistForm.name,
                      genreId: artistForm.genreId,
                      bio: artistForm.bio,
                      country: artistForm.country,
                      formedYear: artistForm.formedYear ? Number(artistForm.formedYear) : undefined,
                      heroAssetId: artistForm.heroAssetId || undefined,
                    };

                    if (selectedArtistId) {
                      await updateAdminArtist(selectedArtistId, {
                        ...payload,
                        heroAssetId: artistForm.heroAssetId || null,
                      });
                    } else {
                      await createAdminArtist(payload);
                    }
                  })
                }
              >
                {selectedArtistId ? 'Guardar artista' : 'Crear artista'}
              </Button>
              {selectedArtistId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAdminAction(async () => {
                      await deleteAdminArtist(selectedArtistId);
                      setSelectedArtistId('');
                    })
                  }
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-3xl">Albums</h2>
          <div className="mt-5 space-y-4">
            <Select
              value={selectedAlbumId}
              onChange={(event) => setSelectedAlbumId(event.target.value)}
            >
              <option value="">Crear nuevo album</option>
              {bootstrap?.albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title} / {album.artistName}
                </option>
              ))}
            </Select>
            <Input
              value={albumForm.title}
              onChange={(event) =>
                setAlbumForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Titulo"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                value={albumForm.artistId}
                onChange={(event) =>
                  setAlbumForm((current) => ({
                    ...current,
                    artistId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona artista</option>
                {bootstrap?.artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </Select>
              <Select
                value={albumForm.genreId}
                onChange={(event) =>
                  setAlbumForm((current) => ({
                    ...current,
                    genreId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona genero</option>
                {bootstrap?.genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              value={albumForm.description}
              onChange={(event) =>
                setAlbumForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Descripcion"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="date"
                value={albumForm.releaseDate}
                onChange={(event) =>
                  setAlbumForm((current) => ({
                    ...current,
                    releaseDate: event.target.value,
                  }))
                }
              />
              <Select
                value={albumForm.coverAssetId}
                onChange={(event) =>
                  setAlbumForm((current) => ({
                    ...current,
                    coverAssetId: event.target.value,
                  }))
                }
              >
                <option value="">Sin portada</option>
                {imageAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.originalName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void runAdminAction(async () => {
                    const payload = {
                      title: albumForm.title,
                      artistId: albumForm.artistId,
                      genreId: albumForm.genreId,
                      description: albumForm.description,
                      releaseDate: albumForm.releaseDate || undefined,
                      coverAssetId: albumForm.coverAssetId || undefined,
                    };

                    if (selectedAlbumId) {
                      await updateAdminAlbum(selectedAlbumId, {
                        ...payload,
                        releaseDate: albumForm.releaseDate || null,
                        coverAssetId: albumForm.coverAssetId || null,
                      });
                    } else {
                      await createAdminAlbum(payload);
                    }
                  })
                }
              >
                {selectedAlbumId ? 'Guardar album' : 'Crear album'}
              </Button>
              {selectedAlbumId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAdminAction(async () => {
                      await deleteAdminAlbum(selectedAlbumId);
                      setSelectedAlbumId('');
                    })
                  }
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-3xl">Tracks</h2>
          <div className="mt-5 space-y-4">
            <Select
              value={selectedTrackId}
              onChange={(event) => setSelectedTrackId(event.target.value)}
            >
              <option value="">Crear nuevo track</option>
              {bootstrap?.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title} / {track.albumTitle}
                </option>
              ))}
            </Select>
            <Input
              value={trackForm.title}
              onChange={(event) =>
                setTrackForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Titulo del track"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="number"
                value={trackForm.trackNumber}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    trackNumber: event.target.value,
                  }))
                }
                placeholder="Track number"
              />
              <Input
                type="number"
                value={trackForm.durationSec}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    durationSec: event.target.value,
                  }))
                }
                placeholder="Duracion en segundos"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                value={trackForm.artistId}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    artistId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona artista</option>
                {bootstrap?.artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </Select>
              <Select
                value={trackForm.albumId}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    albumId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona album</option>
                {bootstrap?.albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </Select>
              <Select
                value={trackForm.genreId}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    genreId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona genero</option>
                {bootstrap?.genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              value={trackForm.audioAssetId}
              onChange={(event) =>
                setTrackForm((current) => ({
                  ...current,
                  audioAssetId: event.target.value,
                }))
              }
            >
              <option value="">Sin audio asignado</option>
              {audioAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.originalName}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={trackForm.isPublished}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    isPublished: event.target.checked,
                  }))
                }
                className="accent-[var(--color-accent)]"
              />
              Track publicado
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void runAdminAction(async () => {
                    const payload = {
                      title: trackForm.title,
                      trackNumber: Number(trackForm.trackNumber),
                      durationSec: Number(trackForm.durationSec),
                      artistId: trackForm.artistId,
                      albumId: trackForm.albumId,
                      genreId: trackForm.genreId,
                      audioAssetId: trackForm.audioAssetId || undefined,
                      isPublished: trackForm.isPublished,
                    };

                    if (selectedTrackId) {
                      await updateAdminTrack(selectedTrackId, {
                        ...payload,
                        audioAssetId: trackForm.audioAssetId || null,
                      });
                    } else {
                      await createAdminTrack(payload);
                    }
                  })
                }
              >
                {selectedTrackId ? 'Guardar track' : 'Crear track'}
              </Button>
              {selectedTrackId ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAdminAction(async () => {
                      await deleteAdminTrack(selectedTrackId);
                      setSelectedTrackId('');
                    })
                  }
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
