import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)] text-black shadow-[0_0_35px_rgba(255,213,74,0.2)] hover:bg-[#ffe17e] hover:shadow-[0_18px_36px_rgba(255,213,74,0.22)]',
        secondary:
          'border border-white/10 bg-white/8 text-[var(--color-text)] hover:border-[rgba(255,213,74,0.24)] hover:bg-white/12',
        ghost: 'text-[var(--color-text)] hover:bg-white/8',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
