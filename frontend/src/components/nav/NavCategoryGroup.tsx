import type { ReactNode } from "react";

export interface NavCategoryGroupProps {
  id: string;
  label: string;
  children: ReactNode;
}

/** Grupo siempre abierto: overline + lista. El catálogo vive en `lib/nav.ts`. */
export function NavCategoryGroup({
  id,
  label,
  children,
}: NavCategoryGroupProps) {
  return (
    <section
      className="space-y-1"
      data-nav-category={id}
      aria-labelledby={`${id}-label`}
    >
      <h2
        id={`${id}-label`}
        className="px-2.5 pb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]"
      >
        {label}
      </h2>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}
