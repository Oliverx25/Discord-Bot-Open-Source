import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface BotProfilePreviewProps {
  displayName: string;
  username: string;
  tag?: string;
  avatarUrl: string;
  bannerUrl?: string | null;
  usingGlobalAvatar: boolean;
  guildName?: string;
}

/** Vista compacta del perfil de Discord con los assets reales del bot. */
export function BotProfilePreview({
  displayName,
  username,
  tag,
  avatarUrl,
  bannerUrl,
  usingGlobalAvatar,
  guildName,
}: BotProfilePreviewProps) {
  const name = displayName.trim() || username.trim() || "Bot";
  const handle = username.trim() || name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          Bot profile as a member
          {guildName ? ` in #${guildName}` : " in this server"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-[#111214] shadow-lg">
          <div
            className="relative h-20 w-full bg-[#626263] bg-cover bg-center sm:h-24"
            style={
              bannerUrl ? { backgroundImage: `url("${bannerUrl}")` } : undefined
            }
            aria-hidden="true"
          />

          <div className="relative px-4 pb-4 pt-[50px]">
            <div className="absolute left-4 top-0 -translate-y-1/2">
              <div className="relative">
                <UserAvatar
                  src={avatarUrl}
                  name={name}
                  className="size-[80px] border-[6px] border-[#111214] ring-0"
                  fallbackClassName="text-lg"
                />
                <span
                  className="absolute bottom-1 right-1 size-4 rounded-full border-[3px] border-[#111214] bg-[#23a55a]"
                  title="Online"
                  aria-hidden
                />
                <span className="sr-only">Status: online</span>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-[#232428] px-3 py-3 font-[gg_sans,ui-sans-serif,system-ui,sans-serif]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold leading-none text-[#f2f3f5]">
                    {name}
                  </p>
                  <span className="rounded-[3px] bg-[#5865f2] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-white">
                    App
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#b5bac1]">
                  {tag || `@${handle}`}
                </p>
              </div>

              <div className="border-t border-white/10 pt-3">
                <span
                  className={
                    usingGlobalAvatar
                      ? "inline-flex rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-[#b5bac1]"
                      : "inline-flex rounded-md bg-[#1f5f49] px-2 py-1 text-[10px] font-medium text-[#b7f0d5]"
                  }
                >
                  {usingGlobalAvatar ? "Global avatar" : "Server avatar"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
