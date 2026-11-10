"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Palette } from "lucide-react";
import { ThemeStudio } from "@/components/themes/theme-studio";
import { useTheme } from "@/components/providers/theme-provider";
export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { allowCustomerThemes, cancelPreview } = useTheme();
  useEffect(() => {
    if (!open) return;
    const d = dialog.current;
    const button = trigger.current;
    d?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      d?.close();
      button?.focus();
    };
  }, [open]);
  if (!allowCustomerThemes) return null;
  return (
    <>
      <button
        ref={trigger}
        onClick={() => setOpen(true)}
        aria-label="Open Theme Studio"
        aria-haspopup="dialog"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-3 text-sm font-semibold transition hover:border-brand"
      >
        <Palette size={16} />
        {!compact && <span className="hidden lg:inline">Theme Studio</span>}
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            onCancel={() => {
              cancelPreview();
              setOpen(false);
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                cancelPreview();
                setOpen(false);
              }
            }}
            aria-label="NEXVORO Theme Studio"
            className="studio-dialog"
          >
            <ThemeStudio onClose={() => setOpen(false)} />
          </dialog>,
          document.body,
        )}
    </>
  );
}
