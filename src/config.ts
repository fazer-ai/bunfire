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

// NOTE: Domain entries are trimmed, lowercased, and have a leading "@" stripped
// by parseDomainList() before being matched against this pattern. Values like
// "foo", "example.", or entries containing slashes still fail fast at startup.
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

const parseDomainList = (
  raw: string | undefined,
  envName: string,
): string[] => {
  const values = (raw ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
    .filter(Boolean);

  for (const domain of values) {
    if (!DOMAIN_RE.test(domain)) {
      throw new Error(`Invalid domain "${domain}" in ${envName}`);
    }
  }

  return values;
};

const googleClientId = (GOOGLE_CLIENT_ID ?? "").trim();

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
  googleClientId,
  googleOAuthEnabled: googleClientId.length > 0,
  allowedSignupDomains: parseDomainList(
    ALLOWED_SIGNUP_DOMAINS,
    "ALLOWED_SIGNUP_DOMAINS",
  ),
  adminSignupDomains: parseDomainList(
    ADMIN_SIGNUP_DOMAINS,
    "ADMIN_SIGNUP_DOMAINS",
  ),
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
