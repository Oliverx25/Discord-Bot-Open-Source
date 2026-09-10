import { NavCategoryGroup } from "@/components/nav/NavCategoryGroup";
import { NavItem } from "@/components/nav/NavItem";
import { visibleDashboardNav } from "@/lib/nav";
import { isNavActive, STATIC_CATEGORY_ID } from "@/lib/navPath";

export function NavLinks({
  currentPath,
  openCategoryId,
  onOpenCategory,
  onNavigate,
}: {
  currentPath: string;
  openCategoryId: string | null;
  onOpenCategory: (id: string | null) => void;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-3"
      aria-label="Dashboard navigation"
    >
      {visibleDashboardNav().map((category) => {
        const isStatic = category.id === STATIC_CATEGORY_ID;
        return (
          <NavCategoryGroup
            key={category.id}
            id={category.id}
            label={category.label}
            icon={category.icon}
            staticOpen={isStatic}
            open={!isStatic && openCategoryId === category.id}
            onOpenChange={(nextOpen) => {
              if (isStatic) return;
              onOpenCategory(nextOpen ? category.id : null);
            }}
          >
            {category.items.map((item) => (
              <NavItem
                key={`${category.id}-${item.href}-${item.label}`}
                label={item.label}
                href={item.href}
                icon={item.icon}
                soon={item.soon}
                active={isNavActive(item.href, currentPath)}
                onNavigate={onNavigate}
              />
            ))}
          </NavCategoryGroup>
        );
      })}
    </nav>
  );
}
