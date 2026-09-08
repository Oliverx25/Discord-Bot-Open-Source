import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  type Interaction,
} from "discord.js";
import { handleBestsetsCommand } from "../commands/bestsets.js";
import {
  BESTSETS_JUMP_PREFIX,
  BESTSETS_PAGE_PREFIX,
  handleBestsetsJumpSelect,
  handleBestsetsPageButton,
} from "../commands/bestsets.js";
import {
  COVERAGE_SELECT_PREFIX,
  handleCoverageCommand,
  handleCoverageSelect,
} from "../commands/coverage.js";
import { handleCountersCommand } from "../commands/counters.js";
import {
  LOCATION_JUMP_PREFIX,
  LOCATION_PAGE_PREFIX,
  handleLocationCommand,
  handleLocationJumpSelect,
  handleLocationPageButton,
} from "../commands/location.js";
import {
  MOVESET_FILTER_PREFIX,
  MOVESET_PAGE_PREFIX,
  handleMovesetCommand,
  handleMovesetFilterSelect,
  handleMovesetPageButton,
} from "../commands/moveset.js";
import {
  handlePokeinfoAutocomplete,
  handlePokeinfoCommand,
} from "../commands/pokeinfo.js";
import {
  handleBreedingCommand,
  handleSandwichCommand,
} from "../commands/stubs.js";
import {
  TEAMBUILDER_SYN_PREFIX,
  handleTeambuilderAutocomplete,
  handleTeambuilderCommand,
  handleTeambuilderSynergyButton,
} from "../commands/teambuilder.js";
import { handleWeaknessCommand } from "../commands/weakness.js";
import { warmPokemonAutocompleteCache } from "../services/pokemonApi.js";
import { setInteractionEphemeral } from "../config/ephemeral.js";
import { getDexConfig } from "../config/service.js";

const COMMAND_HANDLERS: Record<
  string,
  (i: import("discord.js").ChatInputCommandInteraction) => Promise<void>
> = {
  pokeinfo: handlePokeinfoCommand,
  teambuilder: handleTeambuilderCommand,
  weakness: handleWeaknessCommand,
  coverage: handleCoverageCommand,
  location: handleLocationCommand,
  moveset: handleMovesetCommand,
  bestsets: handleBestsetsCommand,
  counters: handleCountersCommand,
  breeding: handleBreedingCommand,
  sandwich: handleSandwichCommand,
};

export function createDexClient(): Client {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, (ready) => {
    console.log(`[dex-bot] Conectado como ${ready.user.tag}`);
    void warmPokemonAutocompleteCache().catch((error) => {
      console.warn("[dex-bot] Fallo al precargar caché de especies:", error);
    });
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void onInteraction(interaction);
  });

  return client;
}

async function onInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === "teambuilder") {
        await handleTeambuilderAutocomplete(interaction);
        return;
      }
      await handlePokeinfoAutocomplete(interaction);
      return;
    }

    if (interaction.isChatInputCommand()) {
      const handler = COMMAND_HANDLERS[interaction.commandName];
      if (!handler) {
        await interaction.reply({
          content: `Comando \`/${interaction.commandName}\` no registrado.`,
          ephemeral: true,
        });
        return;
      }
      if (interaction.guildId) {
        const cfg = getDexConfig(interaction.guildId);
        setInteractionEphemeral(interaction.id, cfg.forceEphemeral);
      }
      await handler(interaction);
      return;
    }

    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id.startsWith(LOCATION_PAGE_PREFIX)) {
        await handleLocationPageButton(interaction);
        return;
      }
      if (id.startsWith(MOVESET_PAGE_PREFIX)) {
        await handleMovesetPageButton(interaction);
        return;
      }
      if (id.startsWith(BESTSETS_PAGE_PREFIX)) {
        await handleBestsetsPageButton(interaction);
        return;
      }
      if (id.startsWith(TEAMBUILDER_SYN_PREFIX)) {
        await handleTeambuilderSynergyButton(interaction);
        return;
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;
      if (id.startsWith(LOCATION_JUMP_PREFIX)) {
        await handleLocationJumpSelect(interaction);
        return;
      }
      if (id.startsWith(MOVESET_FILTER_PREFIX)) {
        await handleMovesetFilterSelect(interaction);
        return;
      }
      if (id.startsWith(BESTSETS_JUMP_PREFIX)) {
        await handleBestsetsJumpSelect(interaction);
        return;
      }
      if (id.startsWith(COVERAGE_SELECT_PREFIX)) {
        await handleCoverageSelect(interaction);
      }
    }
  } catch (error) {
    console.error("[dex-bot] Error en interacción:", error);
    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction
        .reply({
          content: "Ocurrió un error al procesar la interacción.",
          ephemeral: true,
        })
        .catch(() => undefined);
    }
  }
}
