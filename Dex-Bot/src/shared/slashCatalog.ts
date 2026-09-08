/**
 * Catálogo slash de Dex Competitivo (autosuficiente, sin @adobos/shared SaaS).
 */

import {
  ApplicationCommandOptionType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import {
  POKEINFO_FORMAT_CHOICES,
  POKEMON_TYPE_CHOICES,
} from "./pokemon.js";

const SLOT_CHOICES = [1, 2, 3, 4, 5, 6].map((n) => ({
  name: `Slot ${n}`,
  value: n,
}));

function publicoOption() {
  return {
    type: ApplicationCommandOptionType.Boolean as const,
    name: "publico",
    description:
      "Mostrar el resultado a todos en el canal (Por defecto: Falso).",
    required: false,
  };
}

export const DEX_SLASH_COMMANDS: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
  [
    {
      name: "pokeinfo",
      description: "Ficha enriquecida de una especie.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número de la especie.",
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "juego_formato",
          description: "Juego / formato competitivo.",
          required: false,
          choices: POKEINFO_FORMAT_CHOICES.map((c) => ({
            name: c.name,
            value: c.value,
          })),
        },
        publicoOption(),
      ],
    },
    {
      name: "teambuilder",
      description: "Constructor interactivo de equipos (hasta 6).",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "view",
          description: "Muestra el panel actual del equipo.",
          options: [publicoOption()],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Añade una especie al equipo.",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "pokemon",
              description: "Nombre o forma.",
              required: true,
              autocomplete: true,
            },
            publicoOption(),
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "remove",
          description: "Quita por número de slot.",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "slot",
              description: "Slot del equipo (1–6).",
              required: true,
              choices: SLOT_CHOICES,
            },
            publicoOption(),
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "clear",
          description: "Vacía todo el equipo.",
          options: [publicoOption()],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "moves",
          description: "Asigna hasta 4 movimientos a un slot.",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "slot",
              description: "Slot del equipo (1–6).",
              required: true,
              choices: SLOT_CHOICES,
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "move1",
              description: "Movimiento 1.",
              required: false,
              autocomplete: true,
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "move2",
              description: "Movimiento 2.",
              required: false,
              autocomplete: true,
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "move3",
              description: "Movimiento 3.",
              required: false,
              autocomplete: true,
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "move4",
              description: "Movimiento 4.",
              required: false,
              autocomplete: true,
            },
            publicoOption(),
          ],
        },
      ],
    },
    {
      name: "weakness",
      description: "Debilidades, resistencias e inmunidades defensivas.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "teratipo",
          description: "Calcula solo con este tipo (ignora biológicos).",
          required: false,
          choices: POKEMON_TYPE_CHOICES.map((c) => ({
            name: c.name,
            value: c.value,
          })),
        },
        publicoOption(),
      ],
    },
    {
      name: "coverage",
      description: "Cobertura ofensiva con hasta 4 ataques.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        publicoOption(),
      ],
    },
    {
      name: "location",
      description: "Ubicaciones / encuentros salvajes.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        publicoOption(),
      ],
    },
    {
      name: "moveset",
      description: "Movimientos aprendibles por generación.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "juego_formato",
          description: "Juego / formato.",
          required: false,
          choices: POKEINFO_FORMAT_CHOICES.map((c) => ({
            name: c.name,
            value: c.value,
          })),
        },
        publicoOption(),
      ],
    },
    {
      name: "bestsets",
      description: "Builds competitivos por formato.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        publicoOption(),
      ],
    },
    {
      name: "counters",
      description: "Amenazas y checks competitivos.",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: true,
          autocomplete: true,
        },
        publicoOption(),
      ],
    },
    {
      name: "breeding",
      description: "Cría y egg groups (stub).",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: false,
          autocomplete: true,
        },
      ],
    },
    {
      name: "sandwich",
      description: "Recetas de picnic SV (stub).",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pokemon",
          description: "Nombre o número.",
          required: false,
          autocomplete: true,
        },
      ],
    },
  ];
