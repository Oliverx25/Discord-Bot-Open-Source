#!/usr/bin/env node
/**
 * Generador de carga standalone (sin dependencias — `fetch` nativo) usado
 * para la prueba de carga de Fase 8 (`docs/CAPACITY.md`). Pensado para
 * correr en un contenedor aparte, en la misma red Docker que el stack bajo
 * prueba (ver "Cómo repetir esta prueba" en ese doc) — no asume nada del
 * host, solo `fetch` global (Node ≥ 18).
 *
 * Env vars: CONCURRENCY (default 50), DURATION_MS (default 20000),
 * TARGET_URL (default http://backend:3000/api/health/ready).
 */

const CONCURRENCY = Number(process.env.CONCURRENCY || 50);
const DURATION_MS = Number(process.env.DURATION_MS || 20000);
const TARGET_URL =
  process.env.TARGET_URL || "http://backend:3000/api/health/ready";

const latencies = [];
let ok = 0;
let fail = 0;
const statusCounts = {};

async function worker(stopAt) {
  while (Date.now() < stopAt) {
    const start = performance.now();
    try {
      const res = await fetch(TARGET_URL);
      await res.text();
      latencies.push(performance.now() - start);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      if (res.ok) ok++;
      else fail++;
    } catch {
      fail++;
      latencies.push(performance.now() - start);
    }
  }
}

function pct(sortedLatencies, p) {
  const idx = Math.floor(sortedLatencies.length * p);
  return sortedLatencies[Math.min(idx, sortedLatencies.length - 1)];
}

async function main() {
  const stopAt = Date.now() + DURATION_MS;
  const workers = Array.from({ length: CONCURRENCY }, () => worker(stopAt));
  const startedAt = Date.now();
  await Promise.all(workers);
  const elapsedSec = (Date.now() - startedAt) / 1000;
  const total = ok + fail;
  const sorted = [...latencies].sort((a, b) => a - b);
  const maxLatency = latencies.reduce((a, b) => Math.max(a, b), 0);

  console.log(
    JSON.stringify(
      {
        target: TARGET_URL,
        concurrency: CONCURRENCY,
        durationSec: elapsedSec,
        totalRequests: total,
        ok,
        fail,
        reqPerSec: Math.round(total / elapsedSec),
        statusCounts,
        latencyMs: {
          p50: Math.round(pct(sorted, 0.5) * 100) / 100,
          p90: Math.round(pct(sorted, 0.9) * 100) / 100,
          p99: Math.round(pct(sorted, 0.99) * 100) / 100,
          max: Math.round(maxLatency * 100) / 100,
        },
      },
      null,
      2,
    ),
  );
}

main();
