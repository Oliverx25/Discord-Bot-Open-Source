import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PanelMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const aside = document.getElementById("tobot-sidebar");
    if (!aside) return;
    if (open) aside.setAttribute("data-open", "");
    else aside.removeAttribute("data-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="tobot-sidebar"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>
      {open ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] z-40 bg-[rgba(5,7,5,0.75)] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
