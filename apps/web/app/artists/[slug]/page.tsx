'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { TrackSummary } from '@freevibes/types';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ApiError,
  followArtist,
  getArtist,
  listTracks,
  type ArtistDetail,
  unfollowArtist,
} from '@/lib/api';
import { formatDuration, toPlayerQueue } from '@/lib/player';
import { useLibraryStore } from '@/store/library-store';
import { usePlayerStore } from '@/store/player-store';
import { useSessionStore } from '@/store/session-store';

export default function ArtistPage() {
  const params = useParams<{ slug: string }>();
  const user = useSessionStore((state) => state.user);
  const overview = useLibraryStore((state) => state.overview);
  const setOverview = useLibraryStore((state) => state.setOverview);
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [artistTracks, setArtistTracks] = useState<TrackSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    if (!params.slug) return;

    void Promise.all([getArtist(params.slug), listTracks({ artistSlug: params.slug, limit: 12 })])
      .then(([artistResponse, trackResponse]) => {
        setArtist(artistResponse);
        setArtistTracks(trackResponse.items);
        setError(null);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof ApiError ? loadError.message : 'No se pudo cargar este artista.',
        );
      });
  }, [params.slug]);

  const isFollowing = artist ? (overview?.followedArtistIds.includes(artist.id) ?? false) : false;

  async function handleFollowToggle() {
    if (!artist) return;

    try {
      const nextOverview = isFollowing
        ? await unfollowArtist(artist.id)
        : await followArtist(artist.id);
      setOverview(nextOverview);
    } catch (toggleError) {
      setError(
        toggleError instanceof ApiError ? toggleError.message : 'No se pudo actualizar el follow.',
      );
    }
  }

  return (
    <AppShell
      title={artist?.name ?? 'Artist'}
      description={
        artist?.bio ??
        'Perfil de artista conectado a catalogo real, follow persistente y cola de reproduccion.'
      }
    >
      {error ? (
        <Card className="mb-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      {!artist ? null : (
        <>
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="overflow-hidden p-0">
              <div className="relative h-[420px]">
                <Image
                  src={artist.heroAsset?.publicUrl ?? '/legacy/FreeVibes.jpg'}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              </div>
            </Card>
            <Card>
              <p className="text-sm text-[var(--color-accent)]">
                {artist.genre.name}
                {artist.country ? ` / ${artist.country}` : ''}
              </p>
              <h2 className="mt-4 font-display text-4xl">{artist.name}</h2>
              <p className="mt-4 text-sm leading-8 text-[var(--color-muted)]">{artist.bio}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {artistTracks.length ? (
                  <Button
                    onClick={() =>
                      setQueue(
                        toPlayerQueue(artistTracks, {
                          sourceType: 'ARTIST',
                          sourceId: artist.id,
                          sourceLabel: artist.name,
                        }),
                        0,
                        {
                          sourceType: 'ARTIST',
                          sourceId: artist.id,
                          sourceLabel: artist.name,
                        },
                      )
                    }
                  >
                    Reproducir artista
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  disabled={!user}
                  onClick={() => void handleFollowToggle()}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Button>
              </div>
              <div className="mt-8 grid gap-4">
                {artist.albums.map((album) => (
                  <Link key={album.id} href={`/albums/${album.slug}`}>
                    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/30 p-4">
                      <div>
                        <p className="font-medium">{album.title}</p>
                        <p className="text-sm text-[var(--color-muted)]">
                          {album._count.tracks} tracks
                        </p>
                      </div>
                      <Button size="sm" variant="secondary">
                        Abrir album
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <section className="mt-8">
            <h2 className="mb-4 font-display text-3xl">Top tracks</h2>
            <div className="space-y-3">
              {artistTracks.length ? (
                artistTracks.map((track, index) => (
                  <Card key={track.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{track.title}</p>
                      <p className="truncate text-sm text-[var(--color-muted)]">
                        {track.albumTitle} / {formatDuration(track.durationSec)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        setQueue(
                          toPlayerQueue(artistTracks, {
                            sourceType: 'ARTIST',
                            sourceId: artist.id,
                            sourceLabel: artist.name,
                          }),
                          index,
                          {
                            sourceType: 'ARTIST',
                            sourceId: artist.id,
                            sourceLabel: artist.name,
                          },
                        )
                      }
                    >
                      Play
                    </Button>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-sm text-[var(--color-muted)]">
                    Este artista aun no tiene tracks publicados.
                  </p>
                </Card>
              )}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
