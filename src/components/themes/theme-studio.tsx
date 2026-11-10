"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { FONTS, type ThemeId } from "@/lib/constants";
import {
  customizationSchema,
  customStyle,
  type Customization,
} from "@/lib/theme-studio";

/** Actual theme tokens, typography and shared panel/button classes—not screenshots. */
function MiniSite({ id, style }: { id: ThemeId; style?: CSSProperties }) {
  return (
    <div data-theme={id} style={style} className="studio-mini bg-bg text-fg">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <b className="text-[10px] tracking-[.2em]">
          NEXVORO<span className="text-brand">.</span>
        </b>
        <span className="text-[8px] text-fg-muted">SHOP　 JOURNAL　 ○</span>
      </div>
      <div className="relative grid min-h-48 grid-cols-[1fr_1fr] items-center gap-2 p-5">
        <div className="relative z-10">
          <p className="text-[7px] tracking-[.2em] text-brand">
            EXCEPTIONAL BY DESIGN
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-[1.05] tracking-tight">
            Beyond
            <br />
            the ordinary.
          </h3>
          <p className="mt-2 text-[8px] text-fg-muted">
            Technology. Beautifully considered.
          </p>
          <span className="mt-4 inline-block rounded-full bg-brand px-3 py-2 text-[7px] font-semibold text-brand-fg">
            Explore collection ↗
          </span>
        </div>
        <div className="studio-object" aria-hidden>
          <div className="studio-headband" />
          <div className="studio-ear left" />
          <div className="studio-ear right" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-5">
        {["Sound, reimagined", "Everyday precision", "Limitless potential"].map(
          (title, i) => (
            <div key={title} className="panel rounded-lg p-2">
              <div className="mb-2 grid h-9 place-items-center rounded bg-bg-muted text-xl text-brand">
                {["◉", "⌘", "▱"][i]}
              </div>
              <p className="text-[7px] font-semibold">{title}</p>
              <span className="text-[6px] text-fg-muted">
                Explore collection →
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
const defaults: Customization = {
  primary: "#a78bfa",
  accent: "#67e8f9",
  background: "#101018",
  surface: "#1d1d29",
  text: "#f5f5fa",
  radius: "soft",
  button: "solid",
  font: "outfit",
  motion: "subtle",
};
export function ThemeStudio({ onClose }: { onClose?: () => void }) {
  const {
    studio,
    theme,
    font,
    setTheme,
    previewTheme,
    cancelPreview,
    customize,
    customization,
    allowCustomerThemes,
  } = useTheme();
  const themes = studio.themes.filter((t) => t.enabled);
  const [selected, setSelected] = useState<ThemeId>(theme);
  const [previewing, setPreviewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Customization>(customization ?? defaults);
  const [message, setMessage] = useState("");
  const selectedTheme = themes.find((t) => t.id === selected) ?? themes[0]!;
  const cancelRef = useRef(cancelPreview);
  useEffect(() => {
    cancelRef.current = cancelPreview;
  }, [cancelPreview]);
  useEffect(() => () => cancelRef.current(), []);
  function preview(id: ThemeId) {
    setSelected(id);
    previewTheme(id);
    setPreviewing(true);
    setMessage("");
  }
  function cancel() {
    cancelPreview();
    setPreviewing(false);
    setEditing(false);
    setSelected(theme);
    setMessage("Preview cancelled. Your saved experience is unchanged.");
  }
  function apply() {
    if (editing) {
      const result = customizationSchema.safeParse(draft);
      if (!result.success) {
        setMessage(result.error.issues[0]!.message);
        return;
      }
      setTheme(selected);
      customize(result.data, true);
    } else setTheme(selected);
    setPreviewing(false);
    setMessage("Your experience is saved on this device.");
  }
  function change(next: Customization) {
    setDraft(next);
    const result = customizationSchema.safeParse(next);
    if (result.success) {
      customize(result.data);
      setPreviewing(true);
      setMessage("");
    } else setMessage(result.error.issues[0]!.message);
  }
  if (!allowCustomerThemes)
    return (
      <div className="p-10">
        <h1 className="text-3xl">Your curated experience</h1>
        <p className="mt-4 text-fg-muted">
          The store has chosen a consistent appearance. Visitor customization is
          currently unavailable.
        </p>
      </div>
    );
  return (
    <div className="studio-content">
      <header className="relative overflow-hidden border-b border-border px-6 pb-10 pt-8 sm:px-10">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[.25em] text-fg-muted">
            <Palette size={14} /> NEXVORO / DESIGN STUDIO
          </p>
          {onClose ? (
            <button
              onClick={() => {
                cancelPreview();
                onClose();
              }}
              aria-label="Close Theme Studio"
              className="studio-icon"
            >
              <X size={20} />
            </button>
          ) : (
            <Link href="/" className="text-xs text-fg-muted">
              Back to store ↗
            </Link>
          )}
        </div>
        <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1fr_.65fr]">
          <div>
            <p className="text-xs tracking-[.2em] text-brand">
              FIVE SIGNATURE WORLDS. ONE NEXVORO.
            </p>
            <h1 className="mt-4 text-5xl font-medium leading-[.98] tracking-[-.06em] sm:text-7xl">
              Choose Your
              <br />
              <span className="studio-gradient-text">Experience.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-fg-muted">
              Same extraordinary technology. An entirely different feeling. Find
              the world that feels like you.
            </p>
            <p className="mt-5 text-[10px] uppercase tracking-widest text-fg-muted">
              Currently wearing —{" "}
              {studio.themes.find((t) => t.id === theme)?.name}
            </p>
          </div>
          <div className="studio-fan" aria-hidden>
            {themes.slice(0, 5).map((t, i) => (
              <div
                key={t.id}
                style={{
                  transform: `translateX(${(i - 2) * 40}px) rotate(${(i - 2) * 11}deg)`,
                  zIndex: 5 - i,
                }}
              >
                <MiniSite id={t.id} />
              </div>
            ))}
          </div>
        </div>
      </header>
      <div className="px-6 py-8 sm:px-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            The signature collection
          </h2>
          <span className="text-[10px] tracking-widest text-fg-muted">
            DESIGNED TO FEEL DIFFERENT
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {themes.map((t, i) => (
            <article
              key={t.id}
              className={`studio-card ${selected === t.id ? "studio-selected" : ""}`}
            >
              <button
                onClick={() => preview(t.id)}
                aria-label={`Preview ${t.name}`}
                className="block w-full overflow-hidden rounded-t-[20px] text-left"
              >
                <MiniSite id={t.id} style={customStyle(t.tokens)} />
              </button>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] tracking-widest text-fg-muted">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {studio.featured === t.id ? "STUDIO PICK" : "SIGNATURE"}
                  </span>
                  {theme === t.id && (
                    <span className="flex items-center gap-1 text-[10px] text-brand">
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-xl font-medium tracking-tight">
                  {t.name}
                </h3>
                <p className="mt-2 min-h-10 text-xs leading-5 text-fg-muted">
                  {t.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="text-lg tracking-tight"
                    style={{
                      fontFamily: FONTS.find(
                        (f) => f.id === (t.tokens?.font ?? font),
                      )?.stack,
                    }}
                  >
                    Aa{" "}
                    <span className="text-[9px] text-fg-muted">
                      Considered type
                    </span>
                  </span>
                  <div
                    data-theme={t.id}
                    className="flex gap-1"
                    aria-label="Theme palette"
                  >
                    <i className="size-3 rounded-full border border-border bg-bg" />
                    <i className="size-3 rounded-full bg-brand" />
                    <i className="size-3 rounded-full bg-accent" />
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => preview(t.id)}
                    className="studio-secondary flex-1"
                  >
                    Preview <ArrowUpRight size={12} />
                  </button>
                  <button
                    onClick={() => {
                      setSelected(t.id);
                      setTheme(t.id);
                      setPreviewing(false);
                      setMessage(`${t.name} applied.`);
                    }}
                    className="studio-primary flex-1"
                  >
                    Apply theme
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <section className="mt-12 scroll-mt-24" aria-label="Live preview">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-widest text-brand">
                YOUR WORLD, IN REAL TIME
              </p>
              <h2 className="mt-2 text-2xl font-medium">
                {selectedTheme.name}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Previous theme"
                className="studio-icon"
                onClick={() =>
                  preview(
                    themes[
                      (themes.findIndex((t) => t.id === selected) +
                        themes.length -
                        1) %
                        themes.length
                    ]!.id,
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="Next theme"
                className="studio-icon"
                onClick={() =>
                  preview(
                    themes[
                      (themes.findIndex((t) => t.id === selected) + 1) %
                        themes.length
                    ]!.id,
                  )
                }
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="studio-secondary"
                onClick={() => {
                  setEditing(!editing);
                  setDraft(customization ?? defaults);
                }}
              >
                <SlidersHorizontal size={14} /> Customize theme
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-bg">
            <div className="flex items-center gap-2 border-b border-border bg-bg-elevated px-5 py-3 text-[10px] text-fg-muted">
              <span className="size-2 rounded-full bg-brand" /> LIVE STOREFRONT
              / nexvoro.home <span className="ml-auto">Scroll to explore</span>
            </div>
            <iframe
              key={selected + JSON.stringify(editing ? draft : null)}
              title={`Live homepage preview — ${selectedTheme.name}`}
              src="/"
              loading="lazy"
              className="h-[560px] w-full border-0"
              onLoad={(event) => {
                const root =
                  event.currentTarget.contentDocument?.documentElement;
                if (!root) return;
                root.dataset.theme = selected;
                const c =
                  editing && customizationSchema.safeParse(draft).success
                    ? draft
                    : selectedTheme.tokens;
                root.removeAttribute("style");
                for (const [k, v] of Object.entries(customStyle(c)))
                  root.style.setProperty(k, v);
                root.dataset.font = c?.font ?? font;
                root.dataset.motion = c?.motion ?? "subtle";
                root.dataset.button = c?.button ?? "solid";
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="studio-primary" onClick={apply}>
              {editing ? "Save customization" : "Apply theme"}
            </button>
            <button className="studio-secondary" onClick={cancel}>
              Cancel preview
            </button>
            <Link className="text-xs text-brand underline" href="/">
              Explore the actual homepage →
            </Link>
            <span className="text-xs text-fg-muted" role="status">
              {message ||
                (previewing
                  ? "Preview only — not saved until you apply."
                  : "Your saved theme follows you across the store.")}
            </span>
          </div>
        </section>
        {editing && (
          <section className="panel mt-6 p-6" aria-label="Customize theme">
            <h3 className="text-xl font-semibold">Make it yours.</h3>
            <p className="mt-2 text-xs text-fg-muted">
              Personal to this device. Text must meet WCAG AA contrast on both
              surfaces.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {(
                ["primary", "accent", "background", "surface", "text"] as const
              ).map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-xs capitalize"
                >
                  {key}
                  <input
                    type="color"
                    aria-label={key}
                    value={draft[key]}
                    onChange={(e) =>
                      change({ ...draft, [key]: e.target.value })
                    }
                    className="h-9 w-14 cursor-pointer rounded border border-border"
                  />
                </label>
              ))}
              {(
                [
                  { key: "radius", values: ["sharp", "soft", "round"] },
                  { key: "button", values: ["solid", "outline"] },
                  { key: "motion", values: ["none", "subtle", "full"] },
                ] as const
              ).map(({ key, values }) => (
                <label key={key} className="text-xs capitalize">
                  {key}
                  <select
                    className="mt-2 w-full rounded-lg border border-border bg-bg-elevated p-3"
                    value={draft[key]}
                    onChange={(e) =>
                      change({ ...draft, [key]: e.target.value })
                    }
                  >
                    {values.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="text-xs">
                Typography
                <select
                  value={draft.font}
                  className="mt-2 w-full rounded-lg border border-border bg-bg-elevated p-3"
                  onChange={(e) =>
                    change({
                      ...draft,
                      font: e.target.value as Customization["font"],
                    })
                  }
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                className="studio-secondary"
                onClick={() => change(defaults)}
              >
                Reset customization
              </button>
              <button
                className="studio-secondary"
                onClick={() => {
                  setTheme(selected);
                  setEditing(false);
                  setMessage("Original theme settings restored.");
                }}
              >
                Restore original theme
              </button>
            </div>
          </section>
        )}
        <section className="mt-14 overflow-x-auto">
          <h2 className="mb-5 text-2xl font-medium">Different by design.</h2>
          <table className="w-full min-w-[480px] text-left text-xs">
            <caption className="sr-only">Theme comparison</caption>
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th className="py-4">Experience</th>
                <th>Character</th>
                <th>Typography</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((t) => (
                <tr key={t.id} className="border-b border-border">
                  <th className="py-4 font-medium">{t.name}</th>
                  <td className="max-w-52 pr-5 text-fg-muted">
                    {t.description}
                  </td>
                  <td>
                    {FONTS.find((f) => f.id === (t.tokens?.font ?? font))?.name}
                  </td>
                  <td className="text-brand">Ready to explore</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <p className="mt-8 text-[10px] text-fg-muted">
          Preferences stay in first-party cookies. Your cart, account and
          checkout remain unchanged.
        </p>
      </div>
    </div>
  );
}
