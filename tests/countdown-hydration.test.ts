import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { createElement } from "react";

/**
 * Reproduction of the real-world failure: the browser hydrated the homepage
 * while the server text said "00" and the client computed "03".
 *
 * The test renders the countdown on the server, then hydrates it against markup
 * whose digits have drifted one second forward — exactly what a slow hydration
 * plus a ticking clock produces. It must not throw a hydration error.
 */

let dom: JSDOM;

beforeAll(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  Object.defineProperty(g, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  g.HTMLElement = dom.window.HTMLElement;
  g.Element = dom.window.Element;
  g.Node = dom.window.Node;
  g.MutationObserver = dom.window.MutationObserver;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
});

afterEach(() => {
  const root = dom.window.document.getElementById("root");
  if (root) root.innerHTML = "";
});

const endsAt = () => new Date(Date.now() + 3 * 86_400_000).toISOString();

async function serverHtml(element: Parameters<typeof import("react-dom/server").renderToString>[0]) {
  const { renderToString } = await import("react-dom/server");
  return renderToString(element);
}

describe("countdown hydration", () => {
  it("server-renders a stable placeholder rather than the live clock", async () => {
    const { Countdown } = await import("@/components/store/countdown");
    const html = await serverHtml(createElement(Countdown, { endsAt: endsAt() }));
    const digits = [...html.matchAll(/leading-none">(\d{2})</g)].map((m) => m[1]);
    expect(digits).toEqual(["00", "00", "00", "00"]);
  });

  it("does not throw when hydrating against drifted (one-second-ahead) text", async () => {
    const { Countdown } = await import("@/components/store/countdown");
    const { hydrateRoot } = await import("react-dom/client");

    const element = createElement(Countdown, { endsAt: endsAt() });
    const html = await serverHtml(element);

    // Simulate drift: the seconds cell the browser is asked to hydrate says 03
    // while a fresh render would say 00.
    const drifted = html.replace(
      /(leading-none">)00(<\/span><span[^>]*>Sec)/,
      "$103$2",
    );
    expect(drifted).not.toBe(html);

    const container = dom.window.document.getElementById("root")!;
    container.innerHTML = drifted;

    const errors: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(" "));
    };

    try {
      hydrateRoot(container, element, {
        onRecoverableError: (error) => errors.push(`RECOVERABLE: ${String(error)}`),
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      console.error = original;
    }

    const hydration = errors.filter((e) => /hydrat|did not match|didn't match/i.test(e));
    expect(hydration).toEqual([]);
  });
});
