import type { ComponentType } from "react";
import { DashboardProviders } from "./DashboardProviders";
import { ActionLogsDashboard } from "@/features/action-logs";
import { AntiRaidDashboard } from "@/features/anti-raid";
import { AutoDeleteDashboard } from "@/features/auto-delete";
import { AutoModDashboard } from "@/features/auto-mod";
import { AutoRepliesDashboard } from "@/features/auto-replies";
import { AutoRoleBuilder } from "@/features/autoroles";
import { BillingDashboard } from "@/features/billing";
import { BotProfileBuilder } from "@/features/bot-profile";
import {
  BanBuilder,
  BoostBuilder,
  LeaveBuilder,
} from "@/features/canvas-events";
import { CustomCommandsDashboard } from "@/features/custom-commands";
import { DashboardHome } from "@/features/dashboard";
import {
  EconomyCasinoDashboard,
  EconomyJobsDashboard,
  EconomySettingsDashboard,
  EconomyShopDashboard,
} from "@/features/economy";
import { FormsDashboard } from "@/features/forms";
import { GiveawaysDashboard } from "@/features/giveaways";
import { LevelsDashboard } from "@/features/levels";
import { EmbedBuilder, MessageSender } from "@/features/messages";
import { ModerationTools, ServerAuditLog } from "@/features/moderation";
import { RemindersDashboard } from "@/features/reminders";
import { RolesBuilderDashboard } from "@/features/roles-builder";
import { ScheduledDashboard } from "@/features/scheduled-messages";
import { StarboardDashboard } from "@/features/starboard";
import { StreamAlertsDashboard } from "@/features/stream-alerts";
import { SystemCommandsDashboard } from "@/features/system-commands";
import { TicketsDashboard } from "@/features/tickets";
import { VoiceRoomsDashboard } from "@/features/voice-rooms";
import { WelcomeBuilder } from "@/features/welcome";
import type { HealthResponse } from "@adobos/shared";
import type { TicketsTab } from "@/features/tickets/TicketsDashboard";

function wrap<P extends object>(Page: ComponentType<P>, props: P) {
  return (
    <DashboardProviders>
      <Page {...props} />
    </DashboardProviders>
  );
}

export function DashboardHomeIsland(props: {
  initialHealth?: HealthResponse | null;
}) {
  return wrap(DashboardHome, props);
}

export function ActionLogsIsland() {
  return wrap(ActionLogsDashboard, {});
}

export function AntiRaidIsland() {
  return wrap(AntiRaidDashboard, {});
}

export function AutoDeleteIsland() {
  return wrap(AutoDeleteDashboard, {});
}

export function AutoModIsland() {
  return wrap(AutoModDashboard, {});
}

export function AutoRepliesIsland() {
  return wrap(AutoRepliesDashboard, {});
}

export function AutoRoleIsland() {
  return wrap(AutoRoleBuilder, {});
}

export function BillingIsland(props: { guildName?: string | null }) {
  return wrap(BillingDashboard, props);
}

export function BotProfileIsland() {
  return wrap(BotProfileBuilder, {});
}

export function BanIsland() {
  return wrap(BanBuilder, {});
}

export function BoostIsland() {
  return wrap(BoostBuilder, {});
}

export function LeaveIsland() {
  return wrap(LeaveBuilder, {});
}

export function CustomCommandsIsland() {
  return wrap(CustomCommandsDashboard, {});
}

export function EconomyCasinoIsland() {
  return wrap(EconomyCasinoDashboard, {});
}

export function EconomyJobsIsland() {
  return wrap(EconomyJobsDashboard, {});
}

export function EconomySettingsIsland() {
  return wrap(EconomySettingsDashboard, {});
}

export function EconomyShopIsland() {
  return wrap(EconomyShopDashboard, {});
}

export function FormsIsland() {
  return wrap(FormsDashboard, {});
}

export function GiveawaysIsland() {
  return wrap(GiveawaysDashboard, {});
}

export function LevelsIsland() {
  return wrap(LevelsDashboard, {});
}

export function EmbedBuilderIsland() {
  return wrap(EmbedBuilder, {});
}

export function MessageSenderIsland() {
  return wrap(MessageSender, {});
}

export function ModerationIsland() {
  return wrap(ModerationTools, {});
}

export function ServerAuditIsland() {
  return wrap(ServerAuditLog, {});
}

export function RemindersIsland() {
  return wrap(RemindersDashboard, {});
}

export function RolesBuilderIsland() {
  return wrap(RolesBuilderDashboard, {});
}

export function ScheduledIsland() {
  return wrap(ScheduledDashboard, {});
}

export function StarboardIsland() {
  return wrap(StarboardDashboard, {});
}

export function StreamAlertsIsland() {
  return wrap(StreamAlertsDashboard, {});
}

export function SystemCommandsIsland() {
  return wrap(SystemCommandsDashboard, {});
}

export function TicketsIsland(props: { initialTab?: TicketsTab }) {
  return wrap(TicketsDashboard, props);
}

export function VoiceRoomsIsland() {
  return wrap(VoiceRoomsDashboard, {});
}

export function WelcomeIsland() {
  return wrap(WelcomeBuilder, {});
}
