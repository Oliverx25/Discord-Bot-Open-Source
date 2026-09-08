import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  StringSelectMenuInteraction,
} from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import type { PokemonAccessContext } from "./service.js";

type DexGuildInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction;

export function pokemonAccessFromInteraction(
  interaction: DexGuildInteraction,
): PokemonAccessContext {
  const member = interaction.member;
  if (!member || typeof member === "string" || !("roles" in member)) {
    return {};
  }
  const guildMember = member as GuildMember;
  return {
    memberRoleIds: [...guildMember.roles.cache.keys()],
    isAdministrator: guildMember.permissions.has(
      PermissionFlagsBits.Administrator,
    ),
  };
}
