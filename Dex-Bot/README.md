# Dex-Bot (Dex Competitivo)

Bot Discord **open-source e independiente** para análisis competitivo de especies.
Extraído del monorepo Adobos SaaS: sin panel web, sin dependencias cruzadas.

## Requisitos

- Node.js 20+
- Token de bot Discord + Application ID

## Setup

```bash
cd Dex-Bot
cp .env.example .env
# Edita DISCORD_TOKEN y DISCORD_CLIENT_ID
npm install
npm run register   # registra slash commands
npm run dev
```

## Comandos

| Slash | Descripción |
|-------|-------------|
| `/pokeinfo` | Enciclopedia de especies |
| `/teambuilder` | Laboratorio de equipos |
| `/weakness` | Análisis defensivo |
| `/coverage` | Cobertura ofensiva |
| `/moveset` | Catálogo de movimientos |
| `/bestsets` | Análisis de builds |
| `/counters` | Amenazas y checks |
| `/location` | Atlas de encuentros |
| `/breeding` | Stub |
| `/sandwich` | Stub |

## Datos

- PokéAPI + Smogon / data.pkmn.cc
- SQLite local (`user_teams` para Teambuilder)
- Footer de atribución: `PokéAPI • Smogon`

## Licencia / Fair Use

Los datos de terceros pertenecen a sus respectivos propietarios.
Este bot es un cliente no oficial con atribución en embeds.
