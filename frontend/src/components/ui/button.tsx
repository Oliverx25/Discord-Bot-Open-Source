import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.1em] transition-[transform,box-shadow,background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-snap)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground shadow-[var(--shadow-hard)] hover:bg-[var(--accent-hover)] hover:translate-x-[var(--press-offset)] hover:translate-y-[var(--press-offset)] hover:shadow-[2px_2px_0_var(--accent-shadow)] active:translate-x-[var(--press-offset-full)] active:translate-y-[var(--press-offset-full)] active:shadow-none",
        secondary:
          "border border-[var(--border-strong)] bg-transparent text-foreground shadow-[var(--shadow-hard-neutral)] hover:border-primary hover:text-[var(--text-accent)] hover:translate-x-[var(--press-offset)] hover:translate-y-[var(--press-offset)] hover:shadow-[2px_2px_0_var(--border-subtle)] active:translate-x-[var(--press-offset-full)] active:translate-y-[var(--press-offset-full)] active:shadow-none",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-foreground shadow-[var(--shadow-hard-neutral)] hover:border-primary hover:translate-x-[var(--press-offset)] hover:translate-y-[var(--press-offset)]",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-[var(--bg-hover)] hover:text-foreground",
        destructive:
          "border border-[var(--danger-border)] bg-transparent text-destructive shadow-[var(--shadow-hard-danger)] hover:bg-[var(--danger-bg)] hover:translate-x-[var(--press-offset)] hover:translate-y-[var(--press-offset)]",
      },
      size: {
        default: "h-[38px] rounded-md px-[18px]",
        sm: "h-8 rounded-md px-3 text-[11px]",
        lg: "h-[46px] rounded-md px-6 text-[13px]",
        icon: "size-[38px] rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
