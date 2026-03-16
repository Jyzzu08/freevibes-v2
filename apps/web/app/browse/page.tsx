'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { AlbumSummary, ArtistSummary, GenreSummary } from '@freevibes/types';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { listAlbums, listArtists, listGenres } from '@/lib/api';

export default function BrowsePage() {
  const [genres, setGenres] = useState<GenreSummary[]>([]);
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [artists, setArtists] = useState<ArtistSummary[]>([]);

  useEffect(() => {
    void Promise.all([listGenres(), listAlbums(), listArtists()]).then(
      ([genreResponse, albumResponse, artistResponse]) => {
        setGenres(genreResponse.items);
        setAlbums(albumResponse.items);
        setArtists(artistResponse.items);
      },
    );
  }, []);

  return (
    <AppShell
      title="Browse"
      description="Exploracion inspirada en FreeVibes legacy: generos visuales, artistas editoriales y albumes listos para reproducirse."
    >
      <section>
        <h2 className="mb-4 font-display text-3xl">Genres</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {genres.map((genre) => (
            <Card key={genre.id} className="group overflow-hidden p-0">
              <div className="relative h-48">
                <Image
                  src={genre.coverUrl ?? '/legacy/FreeVibes.jpg'}
                  alt={genre.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl">{genre.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {genre.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-3xl">Artists</h2>
          <div className="grid gap-4">
            {artists.map((artist) => (
              <Link key={artist.id} href={`/artists/${artist.slug}`}>
                <Card className="group flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    <Image
                      src={artist.imageUrl ?? '/legacy/FreeVibes.jpg'}
                      alt={artist.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl">{artist.name}</h3>
                    <p className="text-sm text-[var(--color-accent)]">{artist.genreName}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-3xl">Albums</h2>
          <div className="grid gap-4">
            {albums.map((album) => (
              <Link key={album.id} href={`/albums/${album.slug}`}>
                <Card className="group flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    <Image
                      src={album.coverUrl ?? '/legacy/FreeVibes.jpg'}
                      alt={album.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl">{album.title}</h3>
                    <p className="text-sm text-[var(--color-muted)]">
                      {album.artistName} / {album.genreName}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
