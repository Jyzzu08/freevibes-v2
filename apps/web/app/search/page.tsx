'use client';

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Play } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError, favoriteTrack, searchCatalog, unfavoriteTrack } from '@/lib/api';
import { toPlayerQueue } from '@/lib/player';
import { useLibraryStore } from '@/store/library-store';
import { usePlayerStore } from '@/store/player-store';
import { useSessionStore } from '@/store/session-store';

export default function SearchPage() {
  const user = useSessionStore((state) => state.user);
  const overview = useLibraryStore((state) => state.overview);
  const setOverview = useLibraryStore((state) => state.setOverview);
  const [query, setQuery] = useState('dream');
  const deferredQuery = useDeferredValue(query);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCatalog>> | null>(null);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const favoriteTrackIds = useMemo(
    () => new Set(overview?.favoriteTrackIds ?? []),
    [overview?.favoriteTrackIds],
  );

  useEffect(() => {
    startTransition(() => {
      void searchCatalog(deferredQuery.trim())
        .then((nextResults) => {
          setResults(nextResults);
          setError(null);
        })
        .catch((searchError) => {
          setError(
            searchError instanceof ApiError
              ? searchError.message
              : 'No se pudo ejecutar la busqueda.',
          );
        });
    });
  }, [deferredQuery]);

  async function handleFavoriteToggle(trackId: string) {
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
      title="Search"
      description="Busqueda real por canciones, artistas, albumes, generos y playlists contra PostgreSQL."
    >
      <div className="mb-8 max-w-xl">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca por tema, artista o genero..."
        />
      </div>

      {error ? (
        <Card className="mb-6 border-red-400/30 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      ) : null}

      {!results ? null : (
        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="mb-4 font-display text-3xl">Tracks</h2>
            <div className="space-y-4">
              {results.tracks.items.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                    <Image
                      src={track.coverUrl ?? '/legacy/FreeVibes.jpg'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-[var(--color-muted)]">
                      {track.artistName} / {track.albumTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!user}
                      onClick={() => void handleFavoriteToggle(track.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${favoriteTrackIds.has(track.id) ? 'fill-black' : ''}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setQueue(
                          toPlayerQueue(results.tracks.items, {
                            sourceType: 'SEARCH',
                            sourceLabel: query.trim() || 'Busqueda',
                          }),
                          results.tracks.items.findIndex((item) => item.id === track.id),
                          {
                            sourceType: 'SEARCH',
                            sourceLabel: query.trim() || 'Busqueda',
                          },
                        )
                      }
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-8">
            <Card>
              <h2 className="mb-4 font-display text-3xl">Artists</h2>
              <div className="space-y-3">
                {results.artists.items.map((artist) => (
                  <Link key={artist.id} href={`/artists/${artist.slug}`}>
                    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/30 p-4">
                      <span>{artist.name}</span>
                      <span className="text-sm text-[var(--color-muted)]">{artist.genreName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-display text-3xl">Albums y playlists</h2>
              <div className="space-y-3">
                {results.albums.items.map((album) => (
                  <Link key={album.id} href={`/albums/${album.slug}`}>
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                      <p>{album.title}</p>
                      <p className="text-sm text-[var(--color-muted)]">{album.artistName}</p>
                    </div>
                  </Link>
                ))}
                {results.playlists.items.map((playlist) => (
                  <Link key={playlist.id} href={`/playlists/${playlist.slug}`}>
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                      <p>{playlist.title}</p>
                      <p className="text-sm text-[var(--color-muted)]">{playlist.ownerName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
