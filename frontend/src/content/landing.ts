export type NavIcon = "LayoutGrid" | "Tag" | "CircleHelp" | "Book";

export type ModuleIcon =
  | "MessageSquare"
  | "Image"
  | "UserPlus"
  | "ScrollText"
  | "ShieldAlert"
  | "Timer"
  | "ClipboardList"
  | "CalendarClock"
  | "Terminal"
  | "TrendingUp"
  | "Coins"
  | "Dices"
  | "Gavel"
  | "UsersRound"
  | "Swords"
  | "MousePointerClick"
  | "Webhook"
  | "BarChart3";

export const NAV_LINKS: Array<{
  label: string;
  href: string;
  icon: NavIcon;
}> = [
  { label: "Modules", href: "#modules", icon: "LayoutGrid" },
  { label: "Pricing", href: "#pricing", icon: "Tag" },
  { label: "FAQ", href: "#faq", icon: "CircleHelp" },
  { label: "Docs", href: "https://docs.tobot.io", icon: "Book" },
];

export const MODULES: Array<{
  icon: ModuleIcon;
  name: string;
  blurb: string;
  pro?: boolean;
}> = [
  { icon: "MessageSquare", name: "Embeds & messages", blurb: "Visual builder, no JSON" },
  { icon: "Image", name: "Welcome cards", blurb: "Canvas-rendered joins, bans, boosts" },
  { icon: "UserPlus", name: "Autoroles", blurb: "Reaction, button and menu roles" },
  { icon: "ScrollText", name: "Action logs", blurb: "Per-channel routing and webhooks" },
  { icon: "ShieldAlert", name: "Auto-mod", blurb: "Filters with escalating punishment", pro: true },
  { icon: "Timer", name: "Auto-delete", blurb: "Scheduled channel cleanup" },
  { icon: "ClipboardList", name: "Forms", blurb: "Interactive modals, answers to a channel" },
  { icon: "CalendarClock", name: "Scheduled messages", blurb: "Per-message timezone" },
  { icon: "Terminal", name: "Custom commands", blurb: "Yours, not ours" },
  { icon: "TrendingUp", name: "Levels", blurb: "Text and voice XP" },
  { icon: "Coins", name: "Economy", blurb: "Bank, jobs, shop", pro: true },
  { icon: "Dices", name: "Casino", blurb: "Roulette, blackjack, coinflip" },
  { icon: "Gavel", name: "Moderation", blurb: "Backed by Discord audit log" },
  { icon: "UsersRound", name: "Role builder", blurb: "Hierarchy without the fights" },
  { icon: "Swords", name: "Pokémon", blurb: "PokéAPI and Smogon data", pro: true },
  { icon: "MousePointerClick", name: "Buttons & menus", blurb: "Components on any message" },
  { icon: "Webhook", name: "Webhooks", blurb: "Fan out anywhere" },
  { icon: "BarChart3", name: "Server stats", blurb: "Who talks, where, when" },
];

export const PRICING_ROWS: Array<{ label: string; free: string; pro: string }> = [
  { label: "Modules included", free: "15 of 18", pro: "All 18" },
  { label: "Servers per subscription", free: "Unlimited", pro: "Unlimited" },
  { label: "Log retention", free: "7 days", pro: "90 days" },
  { label: "Scheduled messages", free: "10", pro: "Unlimited" },
  { label: "Auto-mod filters", free: "—", pro: "With escalation" },
  { label: "Economy and casino", free: "—", pro: "Included" },
  { label: "Pokémon plugin", free: "—", pro: "Included" },
  { label: "Support", free: "Community", pro: "Priority queue" },
];

export const FAQ: Array<{ title: string; content: string }> = [
  {
    title: "Is the free tier a trial?",
    content:
      "No. Fifteen modules stay free with no time limit and no per-server charge. Pro adds three heavier modules, longer log retention, and a priority queue.",
  },
  {
    title: "What happens if I stop paying?",
    content:
      "Pro modules switch off. Your configuration stays. Nothing is deleted and nothing is held hostage.",
  },
  {
    title: "Can I self-host it?",
    content:
      "Yes. One Node process holds the gateway socket and serves the dashboard. The hosted plan exists so you don't have to.",
  },
  {
    title: "Does one subscription really cover every server I run?",
    content:
      "Yes — every server on your account. Three communities, one invoice. That's the whole idea.",
  },
];

export const TAGS = [
  "welcome bots",
  "logging bots",
  "levels bots",
  "economy bots",
  "automod bots",
  "form bots",
] as const;

export const RIVAL_COST_PER_SERVER = 17;
export const PRO_PRICE_USD = 6;

export const AUTH_ERRORS: Record<string, string> = {
  oauth_denied: "You canceled the sign-in or Discord rejected it.",
  oauth_state: "The login session expired. Try again.",
  oauth_token: "Couldn't exchange the code with Discord.",
  oauth_client:
    "Discord rejected the OAuth client. DISCORD_CLIENT_SECRET must be the OAuth2 Client Secret (portal → OAuth2), not the bot token.",
  oauth_user: "Couldn't read your Discord user.",
  oauth_callback: "The OAuth callback failed.",
  oauth_config:
    "Missing OAuth configuration (CLIENT_ID, CLIENT_SECRET, PUBLIC_APP_URL, SESSION_SECRET). The secret can't be the bot token.",
};
