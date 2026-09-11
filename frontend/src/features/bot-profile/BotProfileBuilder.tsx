import {
  BOT_GUILD_NICKNAME_MAX,
  type BotGuildProfileResponse,
} from "@adobos/shared";
import {
  Activity,
  ArrowUpRight,
  Crown,
  Fingerprint,
  Globe2,
  Loader2,
  RotateCcw,
  Save,
  Server,
  Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  HybridImageInput,
  type HybridImageValue,
} from "@/components/shared/HybridImageInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastBanner } from "@/components/ui/toast";
import { useEntitlements } from "@/features/entitlements/useEntitlements";
import { TimezoneCombobox } from "@/features/scheduled-messages/TimezoneCombobox";
import {
  BotProfileApiError,
  fetchBotGuildProfile,
  saveBotGuildProfile,
} from "@/lib/api";
import { resolvePublicAssetUrl } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useGuildQuery } from "@/lib/query/useGuildQuery";
import { BotProfilePreview } from "./BotProfilePreview";

type Feedback =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

type SaveToast = {
  message: string;
  variant: "error" | "success";
};

function resolvePreviewSrc(value: HybridImageValue): string | null {
  if (value instanceof File) return null;
  if (typeof value === "string" && value.trim()) {
    return resolvePublicAssetUrl(value.trim());
  }
  return null;
}

function formatMemberSince(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function imageValueChanged(
  value: HybridImageValue,
  savedValue: string | null,
  hasSavedValue = Boolean(savedValue),
): boolean {
  if (value instanceof File) return true;
  if (value === null) return hasSavedValue;
  return value.trim() !== (savedValue ?? "");
}

const SAVE_ERROR_FIELDS: Record<string, string> = {
  nickname: "Server nickname",
  serverAvatar: "Server avatar",
  serverBanner: "Profile banner",
  settings: "Bot defaults",
  timezone: "Timezone",
  locale: "Language",
  profile: "Bot configuration",
};

function saveErrorMessage(error: unknown): string {
  if (error instanceof BotProfileApiError) {
    const field = error.field
      ? (SAVE_ERROR_FIELDS[error.field] ?? error.field)
      : null;
    return field ? `${field}: ${error.message}` : error.message;
  }
  return error instanceof Error
    ? error.message
    : "Couldn't save the server profile";
}

function StatusChip({
  label,
  value,
  tone = "success",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex min-w-[9.5rem] items-center gap-2 rounded-md border border-border/60 bg-background/30 px-3 py-2">
      <span
        className={
          tone === "success"
            ? "size-1.5 shrink-0 rounded-full bg-[var(--success)]"
            : "size-1.5 shrink-0 rounded-full bg-[var(--warning)]"
        }
        aria-hidden
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`motion-safe:animate-pulse rounded-sm bg-muted/70 ${className}`}
      aria-hidden="true"
    />
  );
}

function BotProfileSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading bot configuration"
    >
      <span className="sr-only">Loading bot configuration…</span>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-9 w-64 max-w-full" />
          <SkeletonBlock className="h-4 w-full max-w-[38rem]" />
          <SkeletonBlock className="h-4 w-3/4 max-w-[30rem]" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-36" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/55 p-3">
        <SkeletonBlock className="h-4 w-24" />
        <div className="flex flex-wrap justify-end gap-2">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-32" />
          <SkeletonBlock className="h-9 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border/70 bg-card p-6">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="size-9 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-56 max-w-full" />
                <SkeletonBlock className="h-4 w-full max-w-[28rem]" />
              </div>
              <SkeletonBlock className="hidden h-6 w-24 sm:block" />
            </div>
            <SkeletonBlock className="mt-5 h-4 w-full max-w-[40rem]" />

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-3 w-full max-w-[34rem]" />
                <SkeletonBlock className="h-8 w-32" />
              </div>
              <div className="space-y-3 border-t border-border/70 pt-6">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-3 w-full max-w-[32rem]" />
                <SkeletonBlock className="h-8 w-40" />
              </div>
              <div className="space-y-3 border-t border-border/70 pt-6">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-24 w-full" />
                <SkeletonBlock className="h-3 w-full max-w-[32rem]" />
                <SkeletonBlock className="h-8 w-40" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-6">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="size-9 shrink-0 rounded-md" />
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-4 w-72 max-w-[70vw]" />
              </div>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-4/5" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-4/5" />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-lg border border-border/70 bg-card p-4">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="mt-2 h-4 w-48" />
            <SkeletonBlock className="mt-5 h-44 w-full rounded-md" />
            <SkeletonBlock className="mt-4 h-16 w-3/4" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function BotProfileBuilder({
  botPresent,
  guildId,
  guildName,
}: {
  botPresent: boolean;
  guildId?: string | null;
  guildName?: string | null;
}) {
  const { can, loading: entitlementsLoading } = useEntitlements();
  const brandingUnlocked = can("branding");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [saveToast, setSaveToast] = useState<SaveToast | null>(null);
  const [profile, setProfile] = useState<BotGuildProfileResponse | null>(null);

  const [nickname, setNickname] = useState("");
  const [avatarValue, setAvatarValue] = useState<HybridImageValue>(null);
  const [bannerValue, setBannerValue] = useState<HybridImageValue>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState<"en" | "es">("en");
  const [objectPreview, setObjectPreview] = useState<string | null>(null);

  const query = useGuildQuery(queryKeys.botProfile, fetchBotGuildProfile, {
    enabled: botPresent,
  });

  const botMissing =
    !botPresent ||
    (feedback.kind === "error" &&
      /bot (?:not|is not) (?:in|installed in)/i.test(feedback.message));

  useEffect(() => {
    if (botPresent) return;
    setLoading(false);
    setFeedback({ kind: "error", message: "Bot not in this server." });
  }, [botPresent]);

  useEffect(() => {
    if (!query.data) return;
    setProfile(query.data);
    setNickname(query.data.nickname);
    setBannerValue(query.data.serverBannerURL);
    setAvatarValue(query.data.serverAvatarURL);
    setTimezone(query.data.settings.timezone);
    setLocale(query.data.settings.locale);
    setLoading(false);
    setFeedback({ kind: "idle" });
  }, [query.data]);

  useEffect(() => {
    if (query.isError) {
      setFeedback({
        kind: "error",
        message:
          query.error instanceof Error
            ? query.error.message
            : "Couldn't load the server profile",
      });
      setLoading(false);
    }
  }, [query.isError, query.error]);

  useEffect(() => {
    if (!(avatarValue instanceof File)) {
      setObjectPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarValue);
    setObjectPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarValue]);

  const isSubmitting = feedback.kind === "loading";

  const previewAvatar = useMemo(() => {
    if (objectPreview) return objectPreview;
    const fromHybrid = resolvePreviewSrc(avatarValue);
    if (fromHybrid) return fromHybrid;
    return profile?.globalAvatarURL ?? "/favicon.svg";
  }, [avatarValue, objectPreview, profile?.globalAvatarURL]);

  const usingGlobalAvatar = useMemo(() => {
    if (avatarValue instanceof File) return false;
    if (typeof avatarValue === "string" && avatarValue.trim()) return false;
    return true;
  }, [avatarValue]);

  const previewDisplayName = nickname.trim() || profile?.username || "Bot";

  const nicknameChanged = profile
    ? nickname.trim() !== profile.nickname
    : false;
  const avatarChanged = profile
    ? imageValueChanged(
        avatarValue,
        profile.serverAvatarURL,
        profile.hasServerAvatar,
      )
    : false;
  const bannerChanged = profile
    ? imageValueChanged(bannerValue, profile.serverBannerURL)
    : false;
  const settingsChanged = profile
    ? timezone !== profile.settings.timezone || locale !== profile.settings.locale
    : false;
  const hasUnsavedChanges =
    nicknameChanged || avatarChanged || bannerChanged || settingsChanged;

  function discardChanges(): void {
    if (!profile) return;
    setNickname(profile.nickname);
    setAvatarValue(profile.serverAvatarURL);
    setBannerValue(profile.serverBannerURL);
    setTimezone(profile.settings.timezone);
    setLocale(profile.settings.locale);
    setFeedback({ kind: "idle" });
    setSaveToast(null);
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!profile || !hasUnsavedChanges) return;
    setFeedback({ kind: "loading" });
    try {
      const trimmedNick = nickname.trim();
      const payload: Parameters<typeof saveBotGuildProfile>[0] = {};

      if (nicknameChanged) {
        payload.nickname = trimmedNick;
        payload.clearNickname = trimmedNick.length === 0;
      }

      if (avatarChanged && avatarValue instanceof File) {
        payload.serverAvatarFile = avatarValue;
      } else if (avatarChanged && (
        avatarValue === null ||
        (typeof avatarValue === "string" && !avatarValue.trim())
      )) {
        payload.clearServerAvatar = true;
      } else if (avatarChanged && typeof avatarValue === "string") {
        const nextUrl = avatarValue.trim();
        payload.serverAvatarUrl = nextUrl;
      }

      if (bannerChanged && bannerValue instanceof File)
        payload.serverBannerFile = bannerValue;
      else if (bannerChanged && bannerValue === null)
        payload.clearServerBanner = true;
      else if (bannerChanged && typeof bannerValue === "string")
        payload.serverBannerUrl = bannerValue.trim();

      if (settingsChanged) {
        if (timezone !== profile.settings.timezone) payload.timezone = timezone;
        if (locale !== profile.settings.locale) payload.locale = locale;
      }

      const result = await saveBotGuildProfile(payload);

      setProfile(result.profile);
      setNickname(result.profile.nickname);
      setAvatarValue(result.profile.serverAvatarURL);
      setBannerValue(result.profile.serverBannerURL);
      setTimezone(result.profile.settings.timezone);
      setLocale(result.profile.settings.locale);
      setFeedback({ kind: "idle" });
      setSaveToast({
        variant: "success",
        message: result.message || "Bot profile updated for this server",
      });
    } catch (error: unknown) {
      const message = saveErrorMessage(error);
      setFeedback({
        kind: "error",
        message,
      });
      setSaveToast({ variant: "error", message });
    }
  }

  function resetNickname(): void {
    setNickname("");
  }

  function clearServerAvatar(): void {
    setAvatarValue(null);
  }

  if (loading) {
    return <BotProfileSkeleton />;
  }

  if (!profile) {
    const inviteHref = guildId
      ? `/auth/invite?guildId=${encodeURIComponent(guildId)}`
      : "/auth/invite";

    return (
      <section
        className="max-w-xl rounded-lg border border-primary/35 bg-primary/5 p-5"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <Server className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                {botMissing
                  ? "Add tobot to this server"
                  : "Bot configuration unavailable"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {botMissing
                  ? `Bot configuration will be available after tobot joins ${guildName ?? "this server"}.`
                  : feedback.kind === "error"
                    ? feedback.message
                    : "The bot profile could not be loaded for this server."}
              </p>
            </div>
            {botMissing ? (
              <Button href={inviteHref} reload size="sm">
                Add to the server
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  void query.refetch();
                }}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            General / Bot
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            Bot configuration
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            Configure how tobot appears and operates in this server. Changes in
            this page are scoped to the selected server.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start lg:self-auto">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || !hasUnsavedChanges}
            onClick={discardChanges}
          >
            <RotateCcw className="size-4" aria-hidden />
            Discard changes
          </Button>
          <Button type="submit" disabled={isSubmitting || !hasUnsavedChanges}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Applying…
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" aria-hidden />
                Save changes
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/55 p-2.5">
        <div className="flex items-center gap-2 px-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Activity className="size-3.5 text-primary" aria-hidden />
          Bot health
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <StatusChip label="Installed" value="Ready" />
          <StatusChip label="Discord" value="Connected" />
          <StatusChip
            label="Member since"
            value={formatMemberSince(profile.joinedAt)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary">
                    <Fingerprint className="size-4" aria-hidden />
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle>Identity and appearance</CardTitle>
                    <CardDescription>
                      Local nickname and avatar for this server only.
                    </CardDescription>
                  </div>
                </div>
                <span className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Server-scoped
                </span>
              </div>
              <p className="max-w-[62ch] pt-2 text-sm text-muted-foreground">
                The global username and account avatar stay unchanged. This
                profile is the identity members see inside {profile.guildName}.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!brandingUnlocked && !entitlementsLoading ? (
                <div className="relative overflow-hidden rounded-lg border border-primary bg-primary p-4 text-primary-foreground shadow-[0_3px_0_var(--shadow-color)]">
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-black/15">
                        <Crown className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
                          Pro feature
                        </p>
                        <h3 className="font-display text-base font-bold leading-tight">
                          Unlock server branding
                        </h3>
                        <p className="max-w-[48ch] text-xs leading-relaxed opacity-85">
                          Customize the bot&apos;s nickname, avatar, and server
                          banner for this server.
                        </p>
                      </div>
                    </div>
                    <Button
                      href="/dashboard/billing"
                      variant="secondary"
                      size="sm"
                      className="shrink-0 border-black bg-black text-white hover:border-black hover:bg-black/85 hover:text-white"
                    >
                      View Pro plan
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="bot-guild-nickname">Server Nickname</Label>
                <Input
                  id="bot-guild-nickname"
                  aria-describedby="bot-guild-nickname-help"
                  value={nickname}
                  maxLength={BOT_GUILD_NICKNAME_MAX}
                  disabled={isSubmitting || !brandingUnlocked}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder={
                    profile?.username ?? "Nickname shown in the server"
                  }
                />
                <p
                  id="bot-guild-nickname-help"
                  className="text-xs text-muted-foreground"
                >
                  This is how the bot appears in the member list. Empty = global
                  username.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || !nickname || !brandingUnlocked}
                  onClick={resetNickname}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset nickname
                </Button>
              </div>

              <div className="space-y-3 border-t border-border/70 pt-6">
                <HybridImageInput
                  id="bot-guild-avatar"
                  label="Server Avatar"
                  value={avatarValue}
                  onChange={setAvatarValue}
                  disabled={isSubmitting || !brandingUnlocked}
                  uploadImmediately
                  placeholder="https://… or upload an image"
                  maxSizeMb={8}
                />
                <p
                  id="bot-guild-avatar-help"
                  className="text-xs text-muted-foreground"
                >
                  Avatar exclusive to this server. If you delete it, the default
                  global avatar is used.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    isSubmitting || usingGlobalAvatar || !brandingUnlocked
                  }
                  onClick={clearServerAvatar}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete server avatar
                </Button>
              </div>
              <div className="space-y-3 border-t border-border/70 pt-6">
                <HybridImageInput
                  id="bot-guild-banner"
                  label="Profile banner"
                  value={bannerValue}
                  onChange={setBannerValue}
                  disabled={isSubmitting || !brandingUnlocked}
                  uploadImmediately
                  placeholder="Upload a banner image"
                  maxSizeMb={8}
                />
                <p className="text-xs text-muted-foreground">
                  Banner shown on the bot profile in this server. Delete it to
                  use the global banner.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || !bannerValue || !brandingUnlocked}
                  onClick={() => setBannerValue(null)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete server banner
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary">
                  <Globe2 className="size-4" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <CardTitle>Bot defaults</CardTitle>
                  <CardDescription>
                    Shared preferences for tobot in this server, independent of
                    individual modules.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <TimezoneCombobox
                  id="bot-default-timezone"
                  label="Timezone"
                  value={timezone}
                  onChange={setTimezone}
                  disabled={isSubmitting}
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The default timezone for native bot features. Module-specific
                  schedules can still override it when needed.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot-locale">Language</Label>
                <Select
                  value={locale}
                  disabled={isSubmitting}
                  onValueChange={(value) => setLocale(value as "en" | "es")}
                >
                  <SelectTrigger id="bot-locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The preferred language for native bot responses in this
                  server. Dashboard language stays unchanged.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <BotProfilePreview
            displayName={previewDisplayName}
            username={profile?.username ?? ""}
            tag={profile?.tag}
            avatarUrl={previewAvatar}
            bannerUrl={
              resolvePreviewSrc(bannerValue) ??
              profile?.serverBannerURL ??
              profile?.globalBannerURL
            }
            usingGlobalAvatar={usingGlobalAvatar}
            guildName={profile?.guildName}
          />
        </aside>
      </div>
      <ToastBanner
        message={saveToast?.message ?? ""}
        variant={saveToast?.variant ?? "info"}
        onDismiss={() => setSaveToast(null)}
      />
    </form>
  );
}
