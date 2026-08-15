import dotenv from "dotenv";

// Loaded via bare import before any module that reads process.env.
// .env holds shared config; .env.local holds per-machine overrides and secrets.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
