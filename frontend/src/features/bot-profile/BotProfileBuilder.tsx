import {
  BOT_GUILD_NICKNAME_MAX,
  type BotGuildProfileResponse,
} from "@adobos/shared";
import {
  Activity,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
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
import { ToastBanner } from "@/components/ui/toast";
import { useEntitlements } from "@/features/entitlements/useEntitlements";
import { fetchBotGuildProfile, saveBotGuildProfile } from "@/lib/api";
import { resolvePublicAssetUrl } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useGuildQuery } from "@/lib/query/useGuildQuery";
import { BotProfilePreview } from "./BotProfilePreview";

type Feedback =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
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

function StatusRow({
  label,
  value,
  tone = "success",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "success"
            ? "inline-flex items-center gap-1.5 text-right text-sm font-medium text-[var(--success)]"
            : "inline-flex items-center gap-1.5 text-right text-sm font-medium text-[var(--warning)]"
        }
      >
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
        {value}
      </dd>
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

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!brandingUnlocked) return;
    setFeedback({ kind: "loading" });
    try {
      const trimmedNick = nickname.trim();
      const payload: Parameters<typeof saveBotGuildProfile>[0] = {
        nickname: trimmedNick,
        clearNickname: trimmedNick.length === 0,
      };

      if (avatarValue instanceof File) {
        payload.serverAvatarFile = avatarValue;
      } else if (
        avatarValue === null ||
        (typeof avatarValue === "string" && !avatarValue.trim())
      ) {
        if (profile?.hasServerAvatar) payload.clearServerAvatar = true;
      } else if (typeof avatarValue === "string") {
        const nextUrl = avatarValue.trim();
        if (nextUrl !== (profile?.serverAvatarURL ?? "")) {
          payload.serverAvatarUrl = nextUrl;
        }
      }
      if (bannerValue instanceof File) payload.serverBannerFile = bannerValue;
      else if (bannerValue === null && profile?.serverBannerURL)
        payload.clearServerBanner = true;
      else if (
        typeof bannerValue === "string" &&
        bannerValue.trim() !== (profile?.serverBannerURL ?? "")
      )
        payload.serverBannerUrl = bannerValue.trim();

      const result = await saveBotGuildProfile(payload);

      setProfile(result.profile);
      setNickname(result.profile.nickname);
      setAvatarValue(result.profile.serverAvatarURL);
      setBannerValue(result.profile.serverBannerURL);
      setFeedback({
        kind: "ok",
        message: result.message || "Bot profile updated for this server",
      });
      setSaveToast({
        variant: "success",
        message: result.message || "Bot profile updated for this server",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't save the server profile";
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
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-sm bg-muted" />
          <div className="h-9 w-64 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded-sm bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-80 animate-pulse rounded-lg border border-border bg-card" />
          <div className="h-72 animate-pulse rounded-lg border border-border bg-card" />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          Loading bot configuration…
        </p>
      </div>
    );
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
        <Button
          type="submit"
          disabled={isSubmitting || !brandingUnlocked}
          className="self-start lg:self-auto"
        >
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
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <CardTitle>Identity and appearance</CardTitle>
                  <CardDescription>
                    Local nickname and avatar for this server only.
                  </CardDescription>
                </div>
                <span className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  This server
                </span>
              </div>
              <p className="max-w-[62ch] pt-2 text-sm text-muted-foreground">
                The global username and account avatar stay unchanged. This
                profile is the identity members see inside {profile.guildName}.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!brandingUnlocked && !entitlementsLoading ? (
                <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                  Per-server branding (nickname and avatar) is part of the Pro
                  plan.
                </p>
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
                  <Activity className="size-4" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <CardTitle>Access and status</CardTitle>
                  <CardDescription>
                    Operational checks for this server configuration.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3">
                <StatusRow label="Installed in this server" value="Ready" />
                <StatusRow label="Discord connection" value="Connected" />
                <StatusRow
                  label="Per-server branding"
                  value={
                    entitlementsLoading
                      ? "Checking"
                      : brandingUnlocked
                        ? "Available"
                        : "Pro plan required"
                  }
                  tone={
                    brandingUnlocked || entitlementsLoading
                      ? "success"
                      : "warning"
                  }
                />
              </dl>
              <p className="border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                Nickname and avatar permissions are verified by Discord when you
                save. If Discord rejects a change, the exact reason appears
                here.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            {feedback.kind === "ok" ? (
              <p
                className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {feedback.message}
              </p>
            ) : null}
            {feedback.kind === "error" ? (
              <p
                className="flex items-center gap-1.5 text-sm text-red-700 dark:text-red-400"
                role="alert"
              >
                <XCircle className="size-4 shrink-0" aria-hidden />
                {feedback.message}
              </p>
            ) : null}
          </div>
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
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                  <ShieldCheck className="size-4" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <CardTitle>Configuration scope</CardTitle>
                  <CardDescription>
                    Know what this page changes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Nickname and avatar changes apply only to{" "}
                <strong className="font-medium text-foreground">
                  {profile.guildName}
                </strong>
                .
              </p>
              <p>
                Global bot identity and future presence controls affect every
                server and are kept separate.
              </p>
            </CardContent>
          </Card>
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
