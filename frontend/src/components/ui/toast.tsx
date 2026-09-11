import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
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
  durationMs = 6000,
  className,
}: ToastBannerProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "info" ? Info : XCircle;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-[var(--bg-raised)] px-4 py-3 shadow-[var(--shadow-2)]",
        variant === "error" && "border-[var(--danger-border)]",
        variant === "success" && "border-[var(--success-border)]",
        variant === "info" && "border-[var(--info-border)]",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-sm">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            variant === "error" && "text-destructive",
            variant === "success" && "text-[var(--success)]",
            variant === "info" && "text-[var(--info)]",
          )}
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-foreground">{message}</p>
        <button
          type="button"
          className="font-mono text-xs text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          Close
        </button>
      </div>
    </div>
  );
}
