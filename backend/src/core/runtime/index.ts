/** Rol de proceso. Un binario, distinto trabajo. Topología split obligatoria. */

export const ADOBO_ROLES = ["api", "gateway", "worker"] as const;

export type AdobosRole = (typeof ADOBO_ROLES)[number];

// Valor interno defensivo hasta que `setRuntimeRole` reciba el rol real desde `loadEnv()`.
let current: AdobosRole = "api";
let workerLeader = false;

export function isAdobosRole(value: string): value is AdobosRole {
  return (ADOBO_ROLES as readonly string[]).includes(value);
}

export function setRuntimeRole(role: AdobosRole): void {
  current = role;
}

export function runtimeRole(): AdobosRole {
  return current;
}

export function roleRunsHttp(role: AdobosRole = current): boolean {
  return role === "api";
}

/** Este rol mantiene un `Client` de discord.js conectado (login + listeners). */
export function roleRunsGateway(role: AdobosRole = current): boolean {
  return role === "gateway";
}

export function roleRunsWorker(role: AdobosRole = current): boolean {
  return role === "worker";
}

export function setWorkerLeader(value: boolean): void {
  workerLeader = value;
}

/** Este proceso es el líder de crons (advisory lock + rol worker). */
export function isWorkerLeader(): boolean {
  return workerLeader;
}
