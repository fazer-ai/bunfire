import type { LevelWithSilentOrString } from "pino";
import packageInfo from "@/../package.json";

const {
  NODE_ENV,
  PUBLIC_URL,
  PORT,
  LOG_LEVEL,
  JWT_SECRET,
  ENCRYPTION_KEY,
  CORS_ORIGIN,
  DATABASE_URL,
  CDN_URL,
  GOOGLE_CLIENT_ID,
  ALLOWED_SIGNUP_DOMAINS,
  ADMIN_SIGNUP_DOMAINS,
} = process.env;

const parseDomainList = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

const config = {
  packageInfo: {
    name: packageInfo.name,
    version: packageInfo.version,
  },
  port: PORT ? Number(PORT) : 3000,
  publicUrl: PUBLIC_URL || "http://localhost:3000",
  env: (NODE_ENV || "development") as "development" | "production",
  logLevel: (LOG_LEVEL || "info") as LevelWithSilentOrString,
  jwtSecret: JWT_SECRET || "change-me-in-production",
  encryptionKey: ENCRYPTION_KEY || "change-me-in-production",
  corsOrigin: CORS_ORIGIN || "localhost:3000",
  databaseUrl: DATABASE_URL,
  cdnUrl: CDN_URL || "http://localhost:3000",
  googleClientId: GOOGLE_CLIENT_ID || "",
  googleOAuthEnabled: Boolean(GOOGLE_CLIENT_ID),
  allowedSignupDomains: parseDomainList(ALLOWED_SIGNUP_DOMAINS),
  adminSignupDomains: parseDomainList(ADMIN_SIGNUP_DOMAINS),
};

if (config.env === "production") {
  if (config.jwtSecret === "change-me-in-production") {
    throw new Error(
      "⚠️  JWT_SECRET must be set in production to something other than the default.",
    );
  }
  if (config.encryptionKey === "change-me-in-production") {
    throw new Error(
      "⚠️  ENCRYPTION_KEY must be set in production to something other than the default.",
    );
  }
}

export default config;
