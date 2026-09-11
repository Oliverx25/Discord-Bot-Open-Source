import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastBannerProps {
  message: string | null;
  variant?: "error" | "success" | "info";
  onDismiss: () => void;
  durationMs?: number;
  className?: string;
}

/** Toast mínimo sin dependencia extra. */
export function ToastBanner({
  message,
  variant = "error",
  onDismiss,
  durationMs,
  className,
}: ToastBannerProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) {
      setIsLeaving(false);
      return;
    }

    setIsLeaving(false);
    const timer = window.setTimeout(() => {
      setIsLeaving(true);
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        onDismissRef.current();
      }, 180);
    }, durationMs ?? (variant === "error" ? 8000 : 5000));
    return () => {
      window.clearTimeout(timer);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [message, durationMs, variant]);

  function dismiss(): void {
    if (isLeaving || exitTimerRef.current !== null) return;
    setIsLeaving(true);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      onDismissRef.current();
    }, 180);
  }

  if (!message) return null;

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "info" ? Info : XCircle;
  const title =
    variant === "success"
      ? "Changes saved"
      : variant === "info"
        ? "Heads up"
        : "Couldn’t save changes";

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      data-state={isLeaving ? "leaving" : "entering"}
      className={cn(
        "tobot-toast fixed inset-x-4 bottom-4 z-50 w-auto max-w-md rounded-lg border p-3 shadow-[var(--shadow-2)] backdrop-blur-sm sm:left-auto sm:right-6 sm:w-[min(100%-3rem,28rem)]",
        variant === "error" &&
          "border-[var(--danger-border)] bg-[var(--danger-bg)]",
        variant === "success" &&
          "border-[var(--success-border)] bg-[var(--success-bg)]",
        variant === "info" &&
          "border-[var(--info-border)] bg-[var(--info-bg)]",
        className,
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            variant === "error" && "text-destructive",
            variant === "success" && "text-[var(--success)]",
            variant === "info" && "text-[var(--info)]",
          )}
          aria-hidden
        />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold leading-5 text-foreground">
            {title}
          </p>
          <p className="text-sm leading-5 text-muted-foreground">{message}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={dismiss}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
