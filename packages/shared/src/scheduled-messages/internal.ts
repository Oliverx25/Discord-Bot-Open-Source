/**
 * Helper privado compartido entre `defaults.ts` y `normalize.ts` (Fase 7,
 * MAINT-01). Deliberadamente NO se reexporta desde el barrel público
 * `scheduled-messages.ts` — nunca fue parte de la API pública del paquete.
 */

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
