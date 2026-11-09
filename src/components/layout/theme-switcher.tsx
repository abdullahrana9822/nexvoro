"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Type, X } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { FONTS, THEMES, type FontId, type ThemeId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, font, setTheme, setFont, resetAppearance } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"themes" | "fonts">("themes");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance settings"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold text-fg transition hover:border-brand hover:text-brand",
          compact ? "size-10 justify-center p-0" : "h-10",
        )}
      >
        <Palette className="size-4" aria-hidden />
        {!compact ? <span className="hidden lg:inline">Theme</span> : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Appearance settings"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-[21rem] overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lifted sm:w-[23rem]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-bold text-fg">Appearance</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-fg-subtle hover:bg-bg-muted hover:text-fg"
                aria-label="Close appearance settings"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex gap-1 border-b border-border p-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "themes"}
                onClick={() => setTab("themes")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                  tab === "themes"
                    ? "bg-brand text-brand-fg"
                    : "text-fg-muted hover:bg-bg-muted",
                )}
              >
                <Palette className="size-3.5" aria-hidden /> Themes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "fonts"}
                onClick={() => setTab("fonts")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                  tab === "fonts"
                    ? "bg-brand text-brand-fg"
                    : "text-fg-muted hover:bg-bg-muted",
                )}
              >
                <Type className="size-3.5" aria-hidden /> Fonts
              </button>
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-3 thin-scrollbar">
              {tab === "themes" ? (
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((option) => {
                    const active = option.id === theme;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme(option.id as ThemeId)}
                        aria-pressed={active}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border p-2.5 text-left transition",
                          active
                            ? "border-brand ring-1 ring-brand"
                            : "border-border hover:border-border-strong",
                        )}
                      >
                        <span className="flex gap-1" aria-hidden>
                          {option.swatch.map((color) => (
                            <span
                              key={color}
                              className="h-7 flex-1 rounded-md border border-black/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-fg">
                          {option.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-fg-subtle">
                          {option.description}
                        </span>
                        {active ? (
                          <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-brand text-brand-fg">
                            <Check className="size-2.5" strokeWidth={3} aria-hidden />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {FONTS.map((option) => {
                    const active = option.id === font;
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => setFont(option.id as FontId)}
                          aria-pressed={active}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                            active
                              ? "border-brand bg-brand-soft"
                              : "border-border hover:border-border-strong",
                          )}
                        >
                          <span>
                            <span
                              className="block text-sm font-semibold text-fg"
                              style={{ fontFamily: option.stack }}
                            >
                              {option.name}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-fg-subtle">
                              {option.category} · {option.description}
                            </span>
                          </span>
                          {active ? (
                            <Check className="size-4 shrink-0 text-brand" strokeWidth={3} aria-hidden />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
              <p className="text-[10px] text-fg-subtle">Saved on this device</p>
              <button
                type="button"
                onClick={resetAppearance}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                Reset to default
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
