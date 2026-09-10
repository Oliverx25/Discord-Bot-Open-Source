import { DashboardProviders } from "./DashboardProviders";
import { PanelChrome } from "@/components/panel/PanelShell";

export function PanelShellIsland({ currentPath }: { currentPath: string }) {
  return (
    <DashboardProviders>
      <PanelChrome currentPath={currentPath} />
    </DashboardProviders>
  );
}
