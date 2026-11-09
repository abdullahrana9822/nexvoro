/**
 * Node-side shim for the `server-only` marker package.
 *
 * Next.js resolves `server-only` to a module that throws if it is bundled into
 * a client component. Standalone scripts (seed, worker, migrations) run outside
 * the Next bundler, so they alias this no-op instead.
 */
export {};
