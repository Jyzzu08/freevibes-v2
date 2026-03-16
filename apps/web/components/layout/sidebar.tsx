'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Library,
  Music2,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';
import { AppLogo } from '@freevibes/ui';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/session-store';

export const navigationLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/browse', label: 'Browse', icon: Music2 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/admin', label: 'Admin', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const links = navigationLinks.filter(
    (link) => link.href !== '/admin' || user?.role === 'ADMIN',
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-full max-w-[300px] flex-col gap-8 border-r border-white/10 bg-black/75 px-6 py-8 backdrop-blur-xl lg:flex">
      <Link href="/" className="inline-flex items-center gap-3">
        <Image
          src="/legacy/Logo FreeVibes.png"
          alt="FreeVibes"
          width={52}
          height={52}
          className="rounded-2xl"
        />
        <AppLogo title="2.0" subtitle="Streaming platform" />
      </Link>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-muted)] transition-all duration-200 hover:bg-white/8 hover:text-[var(--color-text)]',
                pathname === link.href &&
                  'border border-[rgba(255,213,74,0.2)] bg-white/10 text-[var(--color-text)] shadow-[0_12px_32px_rgba(255,213,74,0.08)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-[28px] border border-[rgba(255,213,74,0.18)] bg-[rgba(255,213,74,0.08)] p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-accent)]">
          Legacy DNA
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
          La v2 conserva la identidad negro, blanco y amarillo del proyecto original
          y la convierte en una experiencia premium y modular.
        </p>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const links = navigationLinks.filter(
    (link) => link.href !== '/admin' || user?.role === 'ADMIN',
  );

  return (
    <div className="mb-6 flex flex-col gap-4 lg:hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-3 rounded-[28px] border border-white/10 bg-black/40 px-4 py-4 backdrop-blur"
      >
        <Image
          src="/legacy/Logo FreeVibes.png"
          alt="FreeVibes"
          width={44}
          height={44}
          className="rounded-2xl"
        />
        <AppLogo title="2.0" subtitle="Streaming platform" />
      </Link>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex min-w-fit items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-sm text-[var(--color-muted)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,213,74,0.28)] hover:text-[var(--color-text)] motion-reduce:transform-none',
                pathname === link.href &&
                  'border-[rgba(255,213,74,0.35)] bg-[rgba(255,213,74,0.12)] text-[var(--color-text)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
