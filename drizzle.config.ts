import { defineConfig } from "drizzle-kit";

// drizzle-kit is only used for generating SQL migrations locally.
// Migrations are applied in every environment with `npm run db:migrate`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/nexvoro",
  },
  strict: false,
  verbose: true,
});
