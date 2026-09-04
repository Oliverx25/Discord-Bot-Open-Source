import type { AdobosModule, ModuleContext } from "./types.js";

/**
 * Corre las tres fases de registro de un módulo (`registerHttp` →
 * `registerGateway` → `registerJobs`), saltando las que no declara.
 * Equivale a lo que hace el rol `all`; los tests de módulo lo usan para
 * ejercitar toda la superficie de una vez.
 */
export function runAllModulePhases(
  mod: AdobosModule,
  ctx: ModuleContext,
): void {
  mod.registerHttp?.(ctx);
  mod.registerGateway?.(ctx);
  mod.registerJobs?.(ctx);
}
