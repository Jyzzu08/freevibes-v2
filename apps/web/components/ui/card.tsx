import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(255,213,74,0.22)] hover:shadow-[0_32px_90px_rgba(0,0,0,0.32)] motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}
