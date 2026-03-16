'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Heart, Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ApiError,
  favoriteTrack,
  getAlbum,
  saveAlbum,
  type AlbumDetail,
  unfavoriteTrack,
  unsaveAlbum,
} from '@/lib/api';
import { formatDuration } from '@/lib/player';
import { useLibraryStore } from '@/store/library-store';
import { usePlayerStore } from '@/store/player-store';
import { useSessionStore } from '@/store/session-store';

function toAlbumQueue(album: AlbumDetail) {
  return album.tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artistName: track.artist.name,
    albumTitle: track.album.title,
    coverUrl: track.album.coverAsset?.publicUrl ?? null,
    audioUrl: track.audioAsset?.publicUrl ?? null,
    durationSec: track.durationSec,
    sourceType: 'ALBUM' as const,
    sourceId: album.id,
    sourceLabel: album.title,
  }));
}

export default function AlbumPage() {
  const params = useParams<{ slug: string }>();
  const user = useSessionStore((state) => state.user);
  const overview = useLibraryStore((state) => state.overview);
  const setOverview = useLibraryStore((state) => state.setOverview);
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    if (!params.slug) return;
    void getAlbum(params.slug)
      .then((albumResponse) => {
        setAlbum(albumResponse);
        setError(null);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof ApiError ? loadError.message : 'No se pudo cargar este album.',
        );
      });
  }, [params.slug]);

  const isSaved = album ? (overview?.savedAlbumIds.includes(album.id) ?? false) : false;

  const favoriteTrackIds = useMemo(
    () => new Set(overview?.favoriteTrackIds ?? []),
    [overview?.favoriteTrackIds],
  );

  async function handleAlbumSaveToggle() {
    if (!album) return;

    try {
      const nextOverview = isSaved ? await unsaveAlbum(album.id) : await saveAlbum(album.id);
      setOverview(nextOverview);
    } catch (toggleError) {
      setError(
        toggleError instanceof ApiError
          ? toggleError.message
          : 'No se pudo actualizar el album guardado.',
      );
    }
  }

  async function handleFavoriteTrackToggle(trackId: string) {
    try {
      const nextOverview = favoriteTrackIds.has(trackId)
        ? await unfavoriteTrack(trackId)
        : await favoriteTrack(trackId);
      setOverview(nextOverview);
    } catch (toggleError) {
      setError(
        toggleError instanceof ApiError
          ? toggleError.message
          : 'No se pudo actualizar el favorito.',
      );
    }
  }

  return (
    <AppShell
      title={album?.title ?? 'Album'}
      description={
        album?.description ??
        'Detalle de album con guardado persistente, favoritos y reproduccion real.'
      }
    >
      {error ? (
        <Card className="mb-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      {!album ? null : (
        <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="overflow-hidden p-0">
            <div className="relative h-[420px]">
              <Image
                src={album.coverAsset?.publicUrl ?? '/legacy/FreeVibes.jpg'}
                alt={album.title}
                fill
                className="object-cover"
              />
            </div>
          </Card>
          <Card>
            <p className="text-sm text-[var(--color-accent)]">
              {album.artist.name} / {album.genre.name}
            </p>
            <h2 className="mt-4 font-display text-4xl">{album.title}</h2>
            <p className="mt-4 text-sm leading-8 text-[var(--color-muted)]">
              {album.description || 'Sin descripcion editorial por ahora.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  setQueue(toAlbumQueue(album), 0, {
                    sourceType: 'ALBUM',
                    sourceId: album.id,
                    sourceLabel: album.title,
                  })
                }
              >
                Reproducir album
              </Button>
              <Button
                variant="secondary"
                disabled={!user}
                onClick={() => void handleAlbumSaveToggle()}
              >
                {isSaved ? 'Guardado' : 'Guardar album'}
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {album.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {track.trackNumber}. {track.title}
                    </p>
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {track.genre.name} / {formatDuration(track.durationSec)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!user}
                      onClick={() => void handleFavoriteTrackToggle(track.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${favoriteTrackIds.has(track.id) ? 'fill-black' : ''}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setQueue(toAlbumQueue(album), index, {
                          sourceType: 'ALBUM',
                          sourceId: album.id,
                          sourceLabel: album.title,
                        })
                      }
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
