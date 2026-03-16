import Image from 'next/image';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';

const team = [
  {
    name: 'Jesus Manzanero',
    role: 'Product vision y arquitectura',
    image: '/legacy/Avatar JM.png',
  },
  {
    name: 'Juan Emilio',
    role: 'Diseño y coordinacion funcional',
    image: '/legacy/Juan Emilio Avatar.png',
  },
  {
    name: 'Victor Elipe',
    role: 'Investigacion y documentacion',
    image: '/legacy/Victor Avatar.png',
  },
];

export default function AboutPage() {
  return (
    <AppShell
      title="About FreeVibes"
      description="La v2 respeta el storytelling del proyecto original, pero lo recontextualiza como una plataforma portfolio seria, escalable y lista para evolucionar."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <p className="text-sm leading-8 text-[var(--color-muted)]">
            FreeVibes 2.0 nace como una reinterpretacion completa del repositorio legacy: la
            identidad visual permanece, el stack cambia radicalmente y el objetivo pasa de una demo
            estatica a una plataforma full-stack lista para crecimiento real.
          </p>
          <p className="mt-4 text-sm leading-8 text-[var(--color-muted)]">
            Esta base ya separa legado y v2, dockeriza el entorno, modela el catalogo musical con
            Prisma y deja preparada la sincronizacion futura con fuentes publicas de metadatos.
          </p>
        </Card>
        <Card className="overflow-hidden">
          <div className="relative h-72">
            <Image
              src="/legacy/FreeVibes.jpg"
              alt="FreeVibes cover"
              fill
              className="object-cover"
            />
          </div>
        </Card>
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {team.map((member) => (
          <Card key={member.name}>
            <div className="relative h-48 overflow-hidden rounded-[24px]">
              <Image src={member.image} alt={member.name} fill className="object-cover" />
            </div>
            <h2 className="mt-4 font-display text-2xl">{member.name}</h2>
            <p className="mt-2 text-sm text-[var(--color-accent)]">{member.role}</p>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
