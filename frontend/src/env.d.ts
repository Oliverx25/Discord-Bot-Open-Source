/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import("@adobos/shared").PanelMeUser | null;
    runtime?: {
      env?: {
        ORIGIN_URL?: string;
      };
    };
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE?: string;
  readonly INTERNAL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
