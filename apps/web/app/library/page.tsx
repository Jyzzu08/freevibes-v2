'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { TrackSummary } from '@freevibes/types';
import { Clock3, Heart, LibraryBig, Music4, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ApiError,
  createPlaylist,
  getLibraryOverview,
  unfavoriteTrack,
  unfollowArtist,
  unsaveAlbum,
} from '@/lib/api';
import { formatDuration, toPlayerQueue } from '@/lib/player';
import { useLibraryStore, type LibraryOverview } from '@/store/library-store';
import { usePlayerStore } from '@/store/player-store';
import { useSessionStore } from '@/store/session-store';

export default function LibraryPage() {
  const user = useSessionStore((state) => state.user);
  const { overview, isLoading, setOverview, setLoading, clearOverview } = useLibraryStore();
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    isPublic: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      clearOverview();
      return;
    }

    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const nextOverview = await getLibraryOverview();
      setOverview(nextOverview);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError ? loadError.message : 'No se pudo cargar la biblioteca.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function syncOverview(promise: Promise<LibraryOverview>) {
    try {
      const nextOverview = await promise;
      setOverview(nextOverview);
      setError(null);
    } catch (syncError) {
      setError(
        syncError instanceof ApiError ? syncError.message : 'No se pudo actualizar la biblioteca.',
      );
    }
  }

  async function handleCreatePlaylist() {
    if (!createForm.title.trim()) {
      setCreateError('La playlist necesita un nombre.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      await createPlaylist({
        title: createForm.title,
        description: createForm.description,
        isPublic: createForm.isPublic,
      });
      setCreateForm({ title: '', description: '', isPublic: false });
      await loadOverview();
    } catch (createPlaylistError) {
      setCreateError(
        createPlaylistError instanceof ApiError
          ? createPlaylistError.message
          : 'No se pudo crear la playlist.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  function playTrackCollection(
    tracks: TrackSummary[],
    startIndex = 0,
    context?: {
      sourceType?: 'LIBRARY';
      sourceId?: string | null;
      sourceLabel?: string | null;
    },
  ) {
    setQueue(toPlayerQueue(tracks, context), startIndex, context);
  }

  if (!user) {
    return (
      <AppShell
        title="Library"
        description="Inicia sesion para ver favoritos, albums guardados, artistas seguidos, playlists y tu historial persistente."
      >
        <Card className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Biblioteca personal
          </p>
          <h2 className="mt-3 font-display text-3xl">Sin sesion activa</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            La biblioteca ya funciona contra backend real. Entra con la cuenta demo o crea un
            usuario para empezar a guardar musica y playlists.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Library"
      description="Favoritos, albums guardados, artistas seguidos, historial y playlists persistidos sobre PostgreSQL."
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Session snapshot
          </p>
          <h2 className="mt-3 font-display text-3xl">
            {user.profile?.displayName ?? user.username}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {user.profile?.bio ??
              'Tu espacio ya esta conectado a favoritos, guardados, follows, historial y playlists reales.'}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <Heart className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-3 text-2xl font-semibold">{overview?.favoriteTracks.length ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Favoritos</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <LibraryBig className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-3 text-2xl font-semibold">{overview?.savedAlbums.length ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Albums guardados</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
              <Music4 className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-3 text-2xl font-semibold">{overview?.playlists.length ?? 0}</p>
              <p className="text-sm text-[var(--color-muted)]">Playlists</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Nueva playlist
              </p>
              <h2 className="mt-3 font-display text-3xl">Crea una lista real</h2>
            </div>
            <Plus className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <div className="mt-5 space-y-4">
            <Input
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Nombre de la playlist"
            />
            <Textarea
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe el mood, concepto o contexto"
            />
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={createForm.isPublic}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    isPublic: event.target.checked,
                  }))
                }
                className="accent-[var(--color-accent)]"
              />
              Hacer publica esta playlist
            </label>
            {createError ? <p className="text-sm text-red-300">{createError}</p> : null}
            <Button disabled={isCreating} onClick={() => void handleCreatePlaylist()}>
              Crear playlist
            </Button>
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="mt-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl">Tus playlists</h2>
          <Button variant="secondary" onClick={() => void loadOverview()}>
            {isLoading ? 'Actualizando...' : 'Refrescar'}
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {overview?.playlists.length ? (
            overview.playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.slug}`}>
                <Card className="h-full">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
                    {playlist.isPublic ? 'Publica' : 'Privada'}
                  </p>
                  <h3 className="mt-3 font-display text-2xl">{playlist.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {playlist.description || 'Sin descripcion por ahora.'}
                  </p>
                  <p className="mt-4 text-sm text-[var(--color-muted)]">
                    {playlist.trackCount} tracks
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-sm text-[var(--color-muted)]">
                Aun no tienes playlists. Crea la primera arriba y ya quedara persistida en tu
                cuenta.
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl">Canciones favoritas</h2>
            {overview?.favoriteTracks.length ? (
              <Button
                variant="secondary"
                onClick={() =>
                  playTrackCollection(overview.favoriteTracks, 0, {
                    sourceType: 'LIBRARY',
                    sourceLabel: 'Favoritos',
                  })
                }
              >
                Reproducir favoritas
              </Button>
            ) : null}
          </div>
          <div className="space-y-3">
            {overview?.favoriteTracks.length ? (
              overview.favoriteTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{track.title}</p>
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {track.artistName} / {track.albumTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        playTrackCollection(overview.favoriteTracks, index, {
                          sourceType: 'LIBRARY',
                          sourceLabel: 'Favoritos',
                        })
                      }
                    >
                      Play
                    </Button>
                    <Button size="sm" onClick={() => void syncOverview(unfavoriteTrack(track.id))}>
                      Quitar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Todavia no has marcado canciones como favoritas.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-3xl">Albums guardados</h2>
          <div className="space-y-3">
            {overview?.savedAlbums.length ? (
              overview.savedAlbums.map((album) => (
                <div
                  key={album.id}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
                >
                  <Link href={`/albums/${album.slug}`} className="min-w-0">
                    <p className="truncate font-medium">{album.title}</p>
                    <p className="truncate text-sm text-[var(--color-muted)]">{album.artistName}</p>
                  </Link>
                  <Button size="sm" onClick={() => void syncOverview(unsaveAlbum(album.id))}>
                    Quitar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Guarda albums desde su ficha para verlos aqui.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="mb-4 font-display text-3xl">Artistas seguidos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {overview?.followedArtists.length ? (
              overview.followedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-4"
                >
                  <Link href={`/artists/${artist.slug}`}>
                    <p className="font-medium">{artist.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{artist.genreName}</p>
                  </Link>
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => void syncOverview(unfollowArtist(artist.id))}
                  >
                    Dejar de seguir
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Sigue artistas desde su pagina para construir tu feed.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl">Recientemente escuchado</h2>
            {overview?.recentlyPlayed.length ? (
              <Button
                variant="secondary"
                onClick={() =>
                  playTrackCollection(overview.recentlyPlayed, 0, {
                    sourceType: 'LIBRARY',
                    sourceLabel: 'Recently played',
                  })
                }
              >
                Reanudar
              </Button>
            ) : null}
          </div>
          <div className="space-y-3">
            {overview?.recentlyPlayed.length ? (
              overview.recentlyPlayed.map((track, index) => (
                <div
                  key={`${track.id}-${track.lastPlayedAt}`}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{track.title}</p>
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {track.artistName} / {formatDuration(track.durationSec)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      playTrackCollection(overview.recentlyPlayed, index, {
                        sourceType: 'LIBRARY',
                        sourceLabel: 'Recently played',
                      })
                    }
                  >
                    Play
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Empieza a reproducir musica y aqui apareceran tus ultimas escuchas.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-3 font-display text-3xl">
          <Clock3 className="h-6 w-6 text-[var(--color-accent)]" />
          Historial de reproduccion
        </h2>
        <div className="space-y-3">
          {overview?.playbackHistory.length ? (
            overview.playbackHistory.map((entry) => (
              <Card key={entry.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                    <Image
                      src={entry.track.coverUrl ?? '/legacy/FreeVibes.jpg'}
                      alt={entry.track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{entry.track.title}</p>
                    <p className="text-sm text-[var(--color-muted)]">
                      {entry.track.artistName} / {entry.track.albumTitle}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-[var(--color-muted)]">
                  <p>{entry.sourceType}</p>
                  <p>{new Date(entry.playedAt).toLocaleString('es-ES')}</p>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-sm text-[var(--color-muted)]">
                El historial aparecera conforme uses el reproductor de FreeVibes 2.0.
              </p>
            </Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}
