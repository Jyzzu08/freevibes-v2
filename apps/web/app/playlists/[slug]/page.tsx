'use client';

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, Play, Trash2, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ApiError,
  addTrackToPlaylist,
  deletePlaylist,
  getPlaylist,
  type PlaylistDetail,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  searchCatalog,
  updatePlaylist,
  uploadImage,
} from '@/lib/api';
import { formatDuration } from '@/lib/player';
import { useLibraryStore } from '@/store/library-store';
import { usePlayerStore } from '@/store/player-store';

function toPlaylistQueue(playlist: PlaylistDetail) {
  return playlist.tracks.map((row) => ({
    id: row.track.id,
    title: row.track.title,
    artistName: row.track.artist.name,
    albumTitle: row.track.album.title,
    coverUrl: row.track.album.coverAsset?.publicUrl ?? null,
    audioUrl: row.track.audioAsset?.publicUrl ?? null,
    durationSec: row.track.durationSec,
    sourceType: 'PLAYLIST' as const,
    sourceId: playlist.id,
    sourceLabel: playlist.title,
  }));
}

function swapTrackPositions(trackIds: string[], firstIndex: number, secondIndex: number) {
  const nextTrackIds = [...trackIds];
  [nextTrackIds[firstIndex], nextTrackIds[secondIndex]] = [
    nextTrackIds[secondIndex],
    nextTrackIds[firstIndex],
  ];
  return nextTrackIds;
}

export default function PlaylistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    isPublic: false,
  });
  const [trackQuery, setTrackQuery] = useState('');
  const deferredTrackQuery = useDeferredValue(trackQuery);
  const [searchResults, setSearchResults] = useState<
    Awaited<ReturnType<typeof searchCatalog>>['tracks']['items']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setLibraryOverview = useLibraryStore((state) => state.setOverview);

  useEffect(() => {
    if (!params.slug) return;
    void loadPlaylist(params.slug);
  }, [params.slug]);

  useEffect(() => {
    if (!playlist?.canEdit || deferredTrackQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    startTransition(() => {
      void searchCatalog(deferredTrackQuery.trim())
        .then((results) => setSearchResults(results.tracks.items))
        .catch(() => setSearchResults([]));
    });
  }, [deferredTrackQuery, playlist?.canEdit]);

  async function loadPlaylist(slug: string) {
    try {
      const nextPlaylist = await getPlaylist(slug);
      setPlaylist(nextPlaylist);
      setEditValues({
        title: nextPlaylist.title,
        description: nextPlaylist.description ?? '',
        isPublic: nextPlaylist.isPublic,
      });
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError ? loadError.message : 'No se pudo cargar la playlist.',
      );
    }
  }

  async function syncPlaylist(promise: Promise<PlaylistDetail>) {
    try {
      const nextPlaylist = await promise;
      setPlaylist(nextPlaylist);
      setEditValues({
        title: nextPlaylist.title,
        description: nextPlaylist.description ?? '',
        isPublic: nextPlaylist.isPublic,
      });
      setError(null);
    } catch (syncError) {
      setError(
        syncError instanceof ApiError ? syncError.message : 'No se pudo actualizar la playlist.',
      );
    }
  }

  async function handleSaveDetails() {
    if (!playlist) return;

    try {
      setIsSaving(true);
      await syncPlaylist(
        updatePlaylist(playlist.id, {
          title: editValues.title,
          description: editValues.description,
          isPublic: editValues.isPublic,
        }),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadCover(file: File) {
    if (!playlist) return;

    try {
      setIsUploadingCover(true);
      const asset = await uploadImage(file);
      await syncPlaylist(
        updatePlaylist(playlist.id, {
          coverAssetId: asset.id,
        }),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError ? uploadError.message : 'No se pudo subir la portada.',
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleDeletePlaylist() {
    if (!playlist) return;

    try {
      setIsDeleting(true);
      await deletePlaylist(playlist.id);
      setLibraryOverview(null);
      router.push('/library');
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError ? deleteError.message : 'No se pudo eliminar la playlist.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const availableTracks = useMemo(() => {
    if (!playlist) return [];
    const currentTrackIds = new Set(playlist.tracks.map((row) => row.track.id));
    return searchResults.filter((track) => !currentTrackIds.has(track.id));
  }, [playlist, searchResults]);

  return (
    <AppShell
      title={playlist?.title ?? 'Playlist'}
      description={
        playlist?.description ?? 'Detalle de playlist conectado al backend real de FreeVibes 2.0.'
      }
    >
      {error ? (
        <Card className="mb-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      {!playlist ? null : (
        <>
          <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
            <Card className="overflow-hidden p-0">
              <div className="relative h-[420px]">
                <Image
                  src={playlist.coverAsset?.publicUrl ?? '/legacy/FreeVibes.jpg'}
                  alt={playlist.title}
                  fill
                  className="object-cover"
                />
                {playlist.canEdit ? (
                  <label className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm">
                    <Upload className="h-4 w-4" />
                    {isUploadingCover ? 'Subiendo...' : 'Portada'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleUploadCover(file);
                        }
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </Card>

            <Card>
              <p className="text-sm text-[var(--color-accent)]">{playlist.owner.displayName}</p>
              <h2 className="mt-4 font-display text-4xl">{playlist.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {playlist.description || 'Sin descripcion por ahora.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    setQueue(toPlaylistQueue(playlist), 0, {
                      sourceType: 'PLAYLIST',
                      sourceId: playlist.id,
                      sourceLabel: playlist.title,
                    })
                  }
                >
                  <Play className="h-4 w-4" />
                  Reproducir playlist
                </Button>
                {playlist.canEdit ? (
                  <Button
                    variant="secondary"
                    disabled={isDeleting}
                    onClick={() => void handleDeletePlaylist()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                ) : null}
              </div>

              {playlist.canEdit ? (
                <div className="mt-8 space-y-4 rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <h3 className="font-display text-2xl">Editar detalles</h3>
                  <Input
                    value={editValues.title}
                    onChange={(event) =>
                      setEditValues((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Titulo"
                  />
                  <Textarea
                    value={editValues.description}
                    onChange={(event) =>
                      setEditValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Descripcion"
                  />
                  <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={editValues.isPublic}
                      onChange={(event) =>
                        setEditValues((current) => ({
                          ...current,
                          isPublic: event.target.checked,
                        }))
                      }
                      className="accent-[var(--color-accent)]"
                    />
                    Hacer publica la playlist
                  </label>
                  <Button disabled={isSaving} onClick={() => void handleSaveDetails()}>
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              ) : null}
            </Card>
          </div>

          <section className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <Card>
              <h2 className="mb-4 font-display text-3xl">Tracks</h2>
              <div className="space-y-3">
                {playlist.tracks.length ? (
                  playlist.tracks.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/25 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {row.position}. {row.track.title}
                        </p>
                        <p className="truncate text-sm text-[var(--color-muted)]">
                          {row.track.artist.name} / {row.track.album.title} /{' '}
                          {formatDuration(row.track.durationSec)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setQueue(toPlaylistQueue(playlist), index, {
                              sourceType: 'PLAYLIST',
                              sourceId: playlist.id,
                              sourceLabel: playlist.title,
                            })
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        {playlist.canEdit ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={index === 0}
                              onClick={() =>
                                void syncPlaylist(
                                  reorderPlaylistTracks(
                                    playlist.id,
                                    swapTrackPositions(
                                      playlist.tracks.map((item) => item.track.id),
                                      index,
                                      index - 1,
                                    ),
                                  ),
                                )
                              }
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={index === playlist.tracks.length - 1}
                              onClick={() =>
                                void syncPlaylist(
                                  reorderPlaylistTracks(
                                    playlist.id,
                                    swapTrackPositions(
                                      playlist.tracks.map((item) => item.track.id),
                                      index,
                                      index + 1,
                                    ),
                                  ),
                                )
                              }
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                void syncPlaylist(
                                  removeTrackFromPlaylist(playlist.id, row.track.id),
                                )
                              }
                            >
                              Quitar
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">
                    Esta playlist aun no tiene canciones.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-display text-3xl">Anadir canciones</h2>
              {playlist.canEdit ? (
                <>
                  <Input
                    value={trackQuery}
                    onChange={(event) => setTrackQuery(event.target.value)}
                    placeholder="Busca canciones por titulo, artista o album"
                  />
                  <div className="mt-5 space-y-3">
                    {availableTracks.length ? (
                      availableTracks.map((track) => (
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
                          <Button
                            size="sm"
                            onClick={() =>
                              void syncPlaylist(addTrackToPlaylist(playlist.id, track.id))
                            }
                          >
                            Anadir
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--color-muted)]">
                        {trackQuery.trim().length < 2
                          ? 'Escribe al menos dos caracteres para buscar tracks.'
                          : 'No hay resultados nuevos para anadir.'}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  Solo el propietario puede editar esta playlist.
                </p>
              )}
            </Card>
          </section>
        </>
      )}
    </AppShell>
  );
}
