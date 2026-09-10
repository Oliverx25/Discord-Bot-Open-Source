import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Coins,
  Dices,
  Gavel,
  Image,
  MessageSquare,
  MousePointerClick,
  ScrollText,
  ShieldAlert,
  Swords,
  Terminal,
  Timer,
  TrendingUp,
  UserPlus,
  UsersRound,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { LandingHeader, Wordmark } from "./LandingHeader";

gsap.registerPlugin(useGSAP);

const TICKER = [
  "One bot, one bill",
  "18 modules",
  "15 free",
  "Priced per account, not per server",
];

const STACK: Array<[string, string]> = [
  ["welcome bot", "$3 · per server"],
  ["logging bot", "$4 · per server"],
  ["levels bot", "$3 · per server"],
  ["economy bot", "free, with ads"],
  ["automod bot", "$5 · per server"],
  ["forms bot", "$2 · per server"],
];

const MODULES: Array<{
  icon: LucideIcon;
  name: string;
  blurb: string;
  pro?: boolean;
}> = [
  { icon: MessageSquare, name: "Embeds & messages", blurb: "Visual builder, no JSON" },
  { icon: Image, name: "Welcome cards", blurb: "Canvas-rendered joins, bans, boosts" },
  { icon: UserPlus, name: "Autoroles", blurb: "Reaction, button and menu roles" },
  { icon: ScrollText, name: "Action logs", blurb: "Per-channel routing and webhooks" },
  { icon: ShieldAlert, name: "Auto-mod", blurb: "Filters with escalating punishment", pro: true },
  { icon: Timer, name: "Auto-delete", blurb: "Scheduled channel cleanup" },
  { icon: ClipboardList, name: "Forms", blurb: "Interactive modals, answers to a channel" },
  { icon: CalendarClock, name: "Scheduled messages", blurb: "Per-message timezone" },
  { icon: Terminal, name: "Custom commands", blurb: "Yours, not ours" },
  { icon: TrendingUp, name: "Levels", blurb: "Text and voice XP" },
  { icon: Coins, name: "Economy", blurb: "Bank, jobs, shop", pro: true },
  { icon: Dices, name: "Casino", blurb: "Roulette, blackjack, coinflip" },
  { icon: Gavel, name: "Moderation", blurb: "Backed by Discord audit log" },
  { icon: UsersRound, name: "Role builder", blurb: "Hierarchy without the fights" },
  { icon: Swords, name: "Pokémon", blurb: "PokéAPI and Smogon data", pro: true },
  { icon: MousePointerClick, name: "Buttons & menus", blurb: "Components on any message" },
  { icon: Webhook, name: "Webhooks", blurb: "Fan out anywhere" },
  { icon: BarChart3, name: "Server stats", blurb: "Who talks, where, when" },
];

const PRICING_ROWS: Array<[string, string, string]> = [
  ["Modules included", "15 of 18", "All 18"],
  ["Servers per subscription", "Unlimited", "Unlimited"],
  ["Log retention", "7 days", "90 days"],
  ["Scheduled messages", "10", "Unlimited"],
  ["Auto-mod filters", "—", "With escalation"],
  ["Economy and casino", "—", "Included"],
  ["Pokémon plugin", "—", "Included"],
  ["Support", "Community", "Priority queue"],
];

const FAQ: Array<[string, string]> = [
  [
    "Is the free tier a trial?",
    "No. Fifteen modules stay free with no time limit and no per-server charge. Pro adds three heavier modules, longer log retention, and a priority queue.",
  ],
  [
    "What happens if I stop paying?",
    "Pro modules switch off. Your configuration stays. Nothing is deleted and nothing is held hostage.",
  ],
  [
    "Can I self-host it?",
    "Yes. One Node process holds the gateway socket and serves the dashboard. The hosted plan exists so you don't have to.",
  ],
  [
    "Does one subscription really cover every server I run?",
    "Yes — every server on your account. Three communities, one invoice. That's the whole idea.",
  ],
];

const TAGS = [
  "welcome bots",
  "logging bots",
  "levels bots",
  "economy bots",
  "automod bots",
  "form bots",
];

function Overline({ children }: { children: string }) {
  return (
    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

function CtaLink({
  href,
  variant,
  size,
  className,
  children,
  reload,
}: {
  href: string;
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "lg";
  className?: string;
  children: ReactNode;
  reload?: boolean;
}) {
  return (
    <a
      href={href}
      {...(reload ? { "data-astro-reload": true } : {})}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </a>
  );
}

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const [servers, setServers] = useState(3);
  const [faqOpen, setFaqOpen] = useState(0);
  const rival = servers * 17;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-copy", {
          y: 18,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
        });
        gsap.from(".stack-row", {
          x: 10,
          opacity: 0,
          stagger: 0.05,
          duration: 0.35,
          delay: 0.12,
          ease: "power2.out",
        });
        gsap.from(".module-cell", {
          y: 10,
          opacity: 0,
          stagger: 0.03,
          duration: 0.32,
          delay: 0.2,
          ease: "power2.out",
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative bg-background text-foreground">
      <LandingHeader />

      <section className="tobot-dither relative flex min-h-[100dvh] flex-col">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-6 pb-16 pt-24 lg:pb-20">
          <div className="hero-copy max-w-[40rem]">
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Six bots do the job.
              <br />
              One <span className="text-primary">should be enough.</span>
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Moderation, logs, welcomes, levels, economy, forms and automation
              in one place. One subscription covers every server you run — not
              one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href="/auth/invite" size="lg" reload>
                Add to Discord
              </CtaLink>
              <CtaLink href="#modules" size="lg" variant="secondary">
                See the 18 modules
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="scroll-mt-24 border-b border-border py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] tracking-[0.16em] text-primary">
                  02 /
                </span>
                <Overline>The wall</Overline>
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Eighteen modules that already know each other
              </h2>
            </div>
            <p className="max-w-[34ch] text-sm text-muted-foreground">
              Levels pay into economy. Auto-mod writes to your logs. Forms
              hand out roles. Nothing to wire up.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="module-cell flex gap-4 bg-card p-5"
                >
                  <Icon
                    className={`mt-0.5 size-[18px] shrink-0 ${mod.pro ? "text-primary" : "text-muted-foreground"}`}
                    aria-hidden
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold">
                        {mod.name}
                      </span>
                      {mod.pro ? (
                        <Badge className="border-primary text-primary">Pro</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {mod.blurb}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Overline>Replaces</Overline>
            {TAGS.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 border-b border-border py-20">
        <div className="mx-auto grid max-w-[1200px] gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.16em] text-primary">
                03 /
              </span>
              <Overline>Pricing</Overline>
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Per account.
              <br />
              Not per server.
            </h2>
            <p className="mt-5 max-w-[42ch] text-base text-muted-foreground">
              Everyone else charges you again for the same bot. Move the slider
              and watch what that stack actually costs.
            </p>
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium">
                Servers you manage
              </p>
              <Slider
                min={1}
                max={12}
                step={1}
                value={[servers]}
                onValueChange={(value) => setServers(value[0] ?? 1)}
                aria-label="Servers you manage"
              />
              <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                <span>1</span>
                <span>12</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-3">
                  <Overline>Typical stack</Overline>
                  <p className="mt-1.5 font-mono text-[22px] text-destructive">
                    ${rival}
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </p>
                </div>
                <div className="rounded-md border border-primary bg-[var(--bg-tint-accent)] p-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    Tobot Pro
                  </span>
                  <p className="mt-1.5 font-mono text-[22px]">
                    $6
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[1.4fr_1fr_1fr]">
              <div className="border-b border-border p-5">
                <Overline>What you get</Overline>
              </div>
              <div className="border-b border-l border-border p-5">
                <Badge>Free</Badge>
                <p className="mt-2 font-mono text-2xl">$0</p>
              </div>
              <div className="border-b border-l border-primary bg-[var(--bg-tint-accent)] p-5">
                <Badge className="border-primary text-primary">Pro</Badge>
                <p className="mt-2 font-mono text-2xl">
                  $6
                  <span className="text-xs text-muted-foreground">/mo</span>
                </p>
              </div>
              {PRICING_ROWS.map(([label, free, pro]) => (
                <div key={label} className="contents">
                  <div className="border-b border-border px-5 py-3 text-sm">
                    {label}
                  </div>
                  <div
                    className={`border-b border-l border-border px-5 py-3 font-mono text-xs ${free === "—" ? "text-muted-foreground" : "text-muted-foreground"}`}
                  >
                    {free}
                  </div>
                  <div className="border-b border-l border-border bg-[rgba(198,255,61,0.05)] px-5 py-3 font-mono text-xs">
                    {pro}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row">
              <CtaLink
                href="/auth/invite"
                variant="secondary"
                className="w-full flex-1"
                reload
              >
                Start free
              </CtaLink>
              <CtaLink href="/login" className="w-full flex-1" reload>
                Go Pro
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-border py-20">
        <div className="mx-auto grid max-w-[1200px] gap-16 px-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.16em] text-primary">
                04 /
              </span>
              <Overline>Questions</Overline>
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
              Answered before you ask
            </h2>
          </div>
          <Accordion>
            {FAQ.map(([title, content], index) => (
              <AccordionItem key={title}>
                <AccordionTrigger
                  open={faqOpen === index}
                  onClick={() =>
                    setFaqOpen((current) => (current === index ? -1 : index))
                  }
                >
                  {title}
                </AccordionTrigger>
                <AccordionContent open={faqOpen === index}>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {content}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="mx-auto max-w-[20ch] font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Turn on one module. Then you decide.
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <CtaLink href="/auth/invite" size="lg" reload>
            Add to Discord
          </CtaLink>
          <CtaLink href="/login" size="lg" variant="ghost" reload>
            Sign in
          </CtaLink>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-6">
          <Wordmark className="text-xl" />
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#modules" className="hover:text-foreground">
              Modules
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <a href="/login" className="hover:text-foreground">
              Dashboard
            </a>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Built for the server that outgrew six bots.
          </span>
        </div>
      </footer>
    </div>
  );
}
