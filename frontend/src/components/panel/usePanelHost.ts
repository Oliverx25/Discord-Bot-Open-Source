import { useEffect, useState } from "react";

/** Hosts del layout que persisten entre navegaciones del panel. */
export function usePanelHost(id: string): HTMLElement | null {
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    function sync(): void {
      setNode(document.getElementById(id));
    }
    sync();
    document.addEventListener("astro:page-load", sync);
    document.addEventListener("astro:after-swap", sync);
    return () => {
      document.removeEventListener("astro:page-load", sync);
      document.removeEventListener("astro:after-swap", sync);
    };
  }, [id]);

  return node;
}
