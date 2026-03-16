import type { ReactNode } from 'react';

export function AppLogo({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,213,74,0.25)] bg-[rgba(255,213,74,0.12)] shadow-[0_0_40px_rgba(255,213,74,0.12)]">
        <span className="text-xl font-black text-[var(--color-accent)]">FV</span>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          FreeVibes
        </p>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">{title}</h1>
        {subtitle ? (
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ShellCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

