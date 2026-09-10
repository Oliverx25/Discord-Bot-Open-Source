import { useEffect, useState } from "react";
import type { PanelMeUser } from "@adobos/shared";
import {
  clearSignedInHint,
  fetchSessionUser,
  writeSignedInHint,
} from "@/lib/api/me";

export type LandingSession = {
  user: PanelMeUser | null;
};

/**
 * El CTA visible lo decide CSS + `html[data-signed-in]` (script inline).
 * Aquí solo confirmamos la sesión y el avatar, sin desmontar el chrome.
 */
export function useLandingSession(): LandingSession {
  const [user, setUser] = useState<PanelMeUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSessionUser().then((next) => {
      if (cancelled) return;
      if (next) {
        setUser(next);
        writeSignedInHint();
      } else {
        setUser(null);
        clearSignedInHint();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user };
}
