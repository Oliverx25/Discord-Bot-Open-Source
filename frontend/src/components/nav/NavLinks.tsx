import { NavCategoryGroup } from "@/components/nav/NavCategoryGroup";
import { NavItem } from "@/components/nav/NavItem";
import { visibleDashboardNav } from "@/lib/nav";
import { isNavActive } from "@/lib/navPath";

export function NavLinks({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="tobot-scroll flex flex-1 flex-col gap-3.5 overflow-y-auto px-2.5 py-3"
      aria-label="Dashboard navigation"
    >
      {visibleDashboardNav().map((category) => (
        <NavCategoryGroup
          key={category.id}
          id={category.id}
          label={category.label}
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
      ))}
    </nav>
  );
}
