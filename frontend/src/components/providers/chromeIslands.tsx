import { Sidebar } from "@/components/custom/Sidebar";
import { AuthGate } from "@/features/auth/AuthGate";
import { DashboardProviders } from "./DashboardProviders";

export function AuthGateIsland() {
  return (
    <DashboardProviders>
      <AuthGate />
    </DashboardProviders>
  );
}

export function SidebarIsland({ currentPath }: { currentPath: string }) {
  return (
    <DashboardProviders>
      <Sidebar currentPath={currentPath} />
    </DashboardProviders>
  );
}
