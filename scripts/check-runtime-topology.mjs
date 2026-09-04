#!/usr/bin/env node
// Guarda la Fase 3 del plan de consolidación (PLAN_FINAL_2026.md): dos únicos
// Compose, tres roles de runtime exactos, roles explícitos por servicio y
// ausencia de la semántica `ADOBO_ROLE=all` en el código y la documentación
// que describen la topología vigente.
//
// Uso: node scripts/check-runtime-topology.mjs

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** @type {string[]} */
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

// 1. Exactamente dos Compose; el antiguo `docker-compose.split.yml` no existe.
const expectedCompose = ["docker-compose.yml", "docker-compose.prod.yml"];
for (const file of expectedCompose) {
  if (!existsSync(path.join(repoRoot, file))) {
    fail(`Falta ${file} (topología split obligatoria).`);
  }
}
if (existsSync(path.join(repoRoot, "docker-compose.split.yml"))) {
  fail(
    "docker-compose.split.yml todavía existe — debió fusionarse en docker-compose.prod.yml.",
  );
}

// 2. Runtime: exactamente los tres roles split, sin `all`.
const runtimeSource = read("backend/src/core/runtime/index.ts");
const rolesLine = 'export const ADOBO_ROLES = ["api", "gateway", "worker"] as const;';
if (!runtimeSource.includes(rolesLine)) {
  fail(
    `backend/src/core/runtime/index.ts no declara exactamente los tres roles split (se esperaba: ${rolesLine}).`,
  );
}

// 3. Cada Compose declara ADOBO_ROLE explícito por servicio de aplicación.
for (const file of expectedCompose) {
  const full = path.join(repoRoot, file);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  for (const role of ["api", "gateway", "worker"]) {
    if (!content.includes(`ADOBO_ROLE: ${role}`)) {
      fail(`${file} no declara \`ADOBO_ROLE: ${role}\` explícito en ningún servicio.`);
    }
  }
}

// 4. Ausencia de semántica `ADOBO_ROLE=all` en docs/config vigentes. Excluye
// PLAN_FINAL_2026.md (documento de trabajo que describe el estado anterior
// deliberadamente) y los tests que confirman el rechazo de `all`.
const allRoleSemantics = /ADOBO_ROLE\s*[:=]\s*"?all"?|role\s*===\s*"all"|\["all"/;
const liveDocs = [
  "README.md",
  "ROADMAP.md",
  ".env.example",
  "docker-compose.yml",
  "docker-compose.prod.yml",
  "backend/src/core/env.ts",
  "backend/src/core/runtime/index.ts",
];
for (const file of liveDocs) {
  const full = path.join(repoRoot, file);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  for (const line of content.split("\n")) {
    if (allRoleSemantics.test(line)) {
      fail(`${file}: referencia activa a ADOBO_ROLE=all → "${line.trim()}"`);
    }
  }
}

if (failures.length > 0) {
  console.error("check-runtime-topology: FALLÓ\n");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("check-runtime-topology: OK — dos Compose, tres roles, sin semántica `all`.");
