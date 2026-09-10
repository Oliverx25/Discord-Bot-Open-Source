import { flattenNavItems, visibleDashboardNav } from "@/lib/nav";

/** Categoría fija: siempre abierta, fuera del acordeón. */
export const STATIC_CATEGORY_ID = "general";

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/";
}

export function isNavActive(href: string, currentPath: string): boolean {
  const target = normalizePath(href);
  if (target === "/dashboard") {
    return currentPath === "/dashboard";
  }
  if (currentPath === target) return true;
  if (!currentPath.startsWith(`${target}/`)) return false;

  const hasMoreSpecific = flattenNavItems().some((item) => {
    const other = normalizePath(item.href);
    return (
      other !== target &&
      other.startsWith(`${target}/`) &&
      (currentPath === other || currentPath.startsWith(`${other}/`))
    );
  });
  return !hasMoreSpecific;
}

/** Categoría acordeón que contiene la ruta activa (nunca `general`). */
export function resolveOpenCategoryId(currentPath: string): string | null {
  for (const category of visibleDashboardNav()) {
    if (category.id === STATIC_CATEGORY_ID) continue;
    const match = category.items.some((item) =>
      isNavActive(item.href, currentPath),
    );
    if (match) return category.id;
  }
  return null;
}
