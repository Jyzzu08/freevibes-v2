'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ApiError, logout, updateProfile } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';

export default function ProfilePage() {
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    setDisplayName(user?.profile?.displayName ?? user?.username ?? '');
    setBio(user?.profile?.bio ?? '');
    setCountry(user?.profile?.country ?? '');
  }, [user]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
      setError(null);
      setSuccess(null);
    } catch (logoutError) {
      setError(logoutError instanceof ApiError ? logoutError.message : 'No se pudo cerrar sesion.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setIsSaving(true);
      setError(null);
      const updatedUser = await updateProfile({
        displayName,
        bio,
        country,
      });
      setUser(updatedUser);
      setSuccess('Perfil actualizado correctamente.');
    } catch (profileError) {
      setSuccess(null);
      setError(profileError instanceof ApiError ? profileError.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Profile"
      description="Gestiona tu sesion, ajusta tu perfil publico y accede a tu biblioteca conectada con FreeVibes 2.0."
    >
      <Card className="max-w-3xl">
        {user ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Cuenta activa
              </p>
              <h2 className="font-display text-3xl">{user.profile?.displayName ?? user.username}</h2>
              <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Tu cuenta ya se conecta con playlists, favoritos, recently played y panel admin si el rol lo permite.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Display name
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(255,213,74,0.35)]"
                  placeholder="Tu nombre en FreeVibes"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Country
                </span>
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  maxLength={80}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(255,213,74,0.35)]"
                  placeholder="Pais"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Bio
              </span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={240}
                rows={5}
                className="w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-3 text-sm leading-7 text-[var(--color-text)] outline-none transition focus:border-[rgba(255,213,74,0.35)]"
                placeholder="Cuenta brevemente que escuchas, curas o construyes."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button disabled={isSaving} onClick={() => void handleSaveProfile()}>
                {isSaving ? 'Guardando...' : 'Guardar perfil'}
              </Button>
              <Button asChild variant="secondary">
                <Link href="/library">Abrir biblioteca</Link>
              </Button>
              {user.role === 'ADMIN' ? (
                <Button asChild variant="secondary">
                  <Link href="/admin">Entrar al panel admin</Link>
                </Button>
              ) : null}
              <Button
                variant="secondary"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesion'}
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              {success ? <p className="text-emerald-300">{success}</p> : null}
              {error ? <p className="text-red-300">{error}</p> : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-display text-3xl">Sin sesion activa</h2>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              Usa `admin@freevibes.local / FreevibesAdmin123!` o crea un usuario nuevo desde la
              pagina de registro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Iniciar sesion</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Crear cuenta</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
