import type { ReactNode } from 'react';
import { MobileNavigation, Sidebar } from './sidebar';

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)] text-[var(--color-text)] lg:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 pb-32 pt-5 sm:px-6 md:px-10 md:pt-8">
        <MobileNavigation />
        <header className="mb-8 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-accent)]">
            FreeVibes 2.0
          </p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)] md:text-base">
            {description}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}
