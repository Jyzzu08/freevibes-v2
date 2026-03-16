import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-6 text-[var(--color-text)]">
      <div className="max-w-xl rounded-[32px] border border-white/10 bg-black/45 p-8 text-center backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,213,74,0.25)] bg-[rgba(255,213,74,0.12)]">
          <Compass className="h-8 w-8 text-[var(--color-accent)]" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.32em] text-[var(--color-accent)]">
          Ruta no encontrada
        </p>
        <h1 className="mt-3 font-display text-4xl">Esta pista no esta en el catalogo</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Puede que el enlace haya caducado, que la playlist ya no exista o que esta pagina aun no forme parte de la demo actual.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/browse">Explorar musica</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
