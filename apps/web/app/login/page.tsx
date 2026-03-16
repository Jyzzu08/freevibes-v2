'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';

interface LoginFormValues {
  emailOrUsername: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginFormValues>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await login(values.emailOrUsername, values.password);
      setSession(response);
      router.push('/profile');
    } catch {
      setError('No se pudo iniciar sesion. Usa las credenciales demo del README.');
    }
  });

  return (
    <AppShell
      title="Login"
      description="Autenticacion real contra NestJS con access token y refresh cookie."
    >
      <Card className="mx-auto max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input placeholder="Email o username" {...register('emailOrUsername')} />
          <Input type="password" placeholder="Password" {...register('password')} />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button className="w-full" disabled={formState.isSubmitting} type="submit">
            Entrar
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
