/**
 * Loads local env files for standalone scripts.
 * Must be imported *before* any module that reads process.env.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
