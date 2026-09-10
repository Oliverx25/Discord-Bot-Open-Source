import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.1em] transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-snap)] focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground hover:bg-[var(--accent-hover)]",
        secondary:
          "border border-[var(--border-strong)] bg-transparent text-foreground hover:border-primary hover:text-[var(--text-accent)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-foreground hover:border-primary",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-[var(--bg-hover)] hover:text-foreground disabled:opacity-40",
        destructive:
          "border border-[var(--danger-border)] bg-transparent text-destructive hover:bg-[var(--danger-bg)]",
        discord:
          "border border-[#5865f2] bg-[#5865f2] font-sans text-sm font-medium normal-case tracking-tight text-white hover:border-[#4752c4] hover:bg-[#4752c4]",
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

type PhysicalTone = "accent" | "neutral" | "danger" | "blurple";

function physicalTone(
  variant: VariantProps<typeof buttonVariants>["variant"],
): PhysicalTone | null {
  if (variant === "ghost") return null;
  if (variant === "destructive") return "danger";
  if (variant === "secondary" || variant === "outline") return "neutral";
  if (variant === "discord") return "blurple";
  return "accent";
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "href">,
    VariantProps<typeof buttonVariants> {
  href?: string;
  as?: "button" | "a" | "span";
  /** View-transition: recarga completa al navegar (Astro). */
  reload?: boolean;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      disabled,
      children,
      href,
      as,
      reload,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const tone = physicalTone(variant);
    const Comp = as ?? (href ? "a" : "button");
    const physical = Boolean(tone);
    const classNames = physical
      ? cn("tobot-physical", `tobot-physical--${tone}`, className)
      : cn(buttonVariants({ variant, size }), className);
    const content = physical ? (
      <span className={cn(buttonVariants({ variant, size }), className)}>
        {children}
      </span>
    ) : (
      children
    );

    if (Comp === "a") {
      return (
        <a
          className={classNames}
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          data-astro-reload={reload ? true : undefined}
          {...props}
        >
          {content}
        </a>
      );
    }

    if (Comp === "span") {
      return (
        <span
          className={classNames}
          ref={ref as React.Ref<HTMLSpanElement>}
          {...props}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        className={classNames}
        type={type}
        disabled={disabled}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
