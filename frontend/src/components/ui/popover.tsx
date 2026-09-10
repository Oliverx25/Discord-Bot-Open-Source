import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  /** Clases del wrapper del trigger (p. ej. `w-full`). */
  rootClassName?: string;
  /**
   * Renderiza el contenido en `document.body` con position:fixed
   * para no deformar el layout del padre.
   */
  portalled?: boolean;
  /** Ancho del panel portalled, para alinear `end` (default w-72). */
  contentWidth?: number;
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  className,
  rootClassName,
  portalled = false,
  contentWidth = 288,
}: PopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !portalled || !rootRef.current) {
      setCoords(null);
      return;
    }
    function place(): void {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = contentWidth;
      let left = align === "end" ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = rect.bottom + 8;
      const maxTop = window.innerHeight - 320 - 8; // h-80 approx
      if (top > maxTop) {
        top = Math.max(8, rect.top - 328);
      }
      setCoords({ top, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, portalled, align, contentWidth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  function onTriggerClick(event: ReactMouseEvent<HTMLElement>): void {
    if (event.defaultPrevented) return;
    onOpenChange(!open);
  }

  const triggerNode = isValidElement(trigger)
    ? cloneElement(
        trigger as ReactElement<{
          onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
        }>,
        {
          onClick: (event: ReactMouseEvent<HTMLElement>) => {
            (
              trigger as ReactElement<{
                onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
              }>
            ).props.onClick?.(event);
            onTriggerClick(event);
          },
        },
      )
    : trigger;

  const panel = open ? (
    <div
      ref={contentRef}
      className={cn(
        "z-[80] rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none",
        !portalled && "absolute mt-2",
        !portalled && (align === "end" ? "right-0" : "left-0"),
        className,
      )}
      style={
        portalled
          ? {
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden",
            }
          : undefined
      }
      role="dialog"
    >
      {children}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative inline-flex", rootClassName)}>
      {triggerNode}
      {portalled && typeof document !== "undefined"
        ? panel
          ? createPortal(panel, document.body)
          : null
        : panel}
    </div>
  );
}

export function PopoverTrigger({
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const id = useId();
  return <button type="button" id={id} className={className} {...props} />;
}
