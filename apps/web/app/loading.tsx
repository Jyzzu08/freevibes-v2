import { Disc3 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-6 text-[var(--color-text)]">
      <div className="flex flex-col items-center gap-4 rounded-[32px] border border-white/10 bg-black/40 px-8 py-10 text-center backdrop-blur">
        <div className="rounded-full border border-[rgba(255,213,74,0.25)] bg-[rgba(255,213,74,0.12)] p-4">
          <Disc3 className="h-10 w-10 animate-spin text-[var(--color-accent)]" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-accent)]">
            FreeVibes 2.0
          </p>
          <h1 className="font-display text-3xl">Cargando experiencia</h1>
          <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">
            Preparando catalogo, biblioteca y reproductor para que sigas exactamente donde lo dejaste.
          </p>
        </div>
      </div>
    </div>
  );
}
