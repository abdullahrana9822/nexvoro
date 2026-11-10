"use client";

import "./globals.css";

/**
 * Last-resort boundary: rendered when the root layout itself throws.
 * It must include its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
          <h1 className="text-2xl font-black tracking-tight">NEXVORO is temporarily unavailable</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            We hit an unexpected error while starting the application. Please retry in a moment.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[11px] text-gray-400">Reference {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-indigo-600 px-6 text-sm font-bold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
