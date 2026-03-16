import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Disc3, Search, ShieldCheck } from 'lucide-react';
import { AppLogo } from '@freevibes/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const genres = [
  { title: 'Pop', image: '/legacy/Pop.jpg' },
  { title: 'House', image: '/legacy/House.jpg' },
  { title: 'Inspirador', image: '/legacy/Inspirador.jpg' },
  { title: 'Relajante', image: '/legacy/Relajante.jpg' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen px-6 pb-32 pt-6 md:px-10">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-full border border-white/10 bg-black/55 px-6 py-4 backdrop-blur transition-colors duration-300">
        <div className="flex items-center gap-4">
          <Image
            src="/legacy/Logo FreeVibes.png"
            alt="FreeVibes"
            width={56}
            height={56}
            className="rounded-2xl"
          />
          <AppLogo title="2.0" subtitle="Music streaming platform" />
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[var(--color-muted)] md:flex">
          <Link className="transition-colors hover:text-[var(--color-text)]" href="/browse">
            Browse
          </Link>
          <Link className="transition-colors hover:text-[var(--color-text)]" href="/search">
            Search
          </Link>
          <Link className="transition-colors hover:text-[var(--color-text)]" href="/about">
            About
          </Link>
        </nav>
      </header>

      <section className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden border-[rgba(255,213,74,0.2)] bg-[linear-gradient(135deg,rgba(255,213,74,0.12),rgba(255,255,255,0.04))]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-accent)]">
                Evolucionando el legado
              </p>
              <h1 className="font-display text-5xl font-semibold leading-tight md:text-7xl">
                FreeVibes se convierte en una plataforma musical full-stack.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--color-muted)]">
                La esencia visual negra, blanca y amarilla sigue intacta, pero ahora vive dentro de
                un monorepo moderno con Next.js, NestJS, Prisma, PostgreSQL, Redis y Docker.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/browse">
                    Explorar catalogo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/search">
                    <Search className="h-4 w-4" />
                    Buscar musica
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {genres.map((genre) => (
                <div
                  key={genre.title}
                  className="group relative h-52 overflow-hidden rounded-[26px] border border-white/10"
                >
                  <Image
                    src={genre.image}
                    alt={genre.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
                      Genre
                    </p>
                    <h2 className="font-display text-2xl">{genre.title}</h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="transition-all duration-300">
            <ShieldCheck className="h-8 w-8 text-[var(--color-accent)]" />
            <h2 className="mt-4 font-display text-2xl">Stack profesional</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              Auth real con JWT, seed desde XML legacy, Swagger, Docker Compose y arquitectura
              preparada para S3 y sincronizacion futura.
            </p>
          </Card>
          <Card className="transition-all duration-300">
            <Disc3 className="h-8 w-8 text-[var(--color-accent)]" />
            <h2 className="mt-4 font-display text-2xl">Player persistente</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              La base ya incluye reproductor inferior, cola persistente y audios demo locales para
              desarrollar sin dependencias externas.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
