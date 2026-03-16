'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { register as registerAccount } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';

interface RegisterFormValues {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterFormValues>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await registerAccount(values);
      setSession(response);
      router.push('/profile');
    } catch {
      setError('No se pudo crear la cuenta demo.');
    }
  });

  return (
    <AppShell title="Register" description="Alta real de usuario sobre PostgreSQL y Prisma.">
      <Card className="mx-auto max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input placeholder="Display name" {...register('displayName')} />
          <Input placeholder="Username" {...register('username')} />
          <Input type="email" placeholder="Email" {...register('email')} />
          <Input type="password" placeholder="Password" {...register('password')} />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button className="w-full" disabled={formState.isSubmitting} type="submit">
            Crear cuenta
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
