type OriginLocals = {
  runtime?: { env?: { ORIGIN_URL?: string } };
};

/** Origen del API Express. En CF viene de wrangler; en `astro dev` de INTERNAL_API_URL. */
export function apiOrigin(locals?: OriginLocals): string {
  // Docker/dev: INTERNAL_API_URL gana sobre wrangler (ORIGIN_URL suele ser 127.0.0.1).
  const fromAstro = import.meta.env.INTERNAL_API_URL?.trim();
  if (fromAstro) return fromAstro.replace(/\/$/, "");
  const fromCf = locals?.runtime?.env?.ORIGIN_URL?.trim();
  if (fromCf) return fromCf.replace(/\/$/, "");
  return "http://127.0.0.1:3000";
}
