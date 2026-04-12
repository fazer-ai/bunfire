import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  createGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  isEmailDomainAllowed,
  linkGoogleIdToUser,
} from "@/api/features/auth/auth.service";
import type { AuthUser } from "@/api/lib/auth";
import config from "@/config";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const GOOGLE_ISSUERS = [
  "accounts.google.com",
  "https://accounts.google.com",
] as const;

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export class GoogleEmailNotVerifiedError extends Error {
  constructor() {
    super("Google account email is not verified");
    this.name = "GoogleEmailNotVerifiedError";
  }
}

export class GoogleEmailDomainNotAllowedError extends Error {
  constructor() {
    super("Google account email domain is not allowed to register");
    this.name = "GoogleEmailDomainNotAllowedError";
  }
}

export class GoogleIdMismatchError extends Error {
  constructor() {
    super("Email is already linked to a different Google account");
    this.name = "GoogleIdMismatchError";
  }
}

export class GoogleAdminLinkBlockedError extends Error {
  constructor() {
    super("ADMIN account must complete a password login before Google linking");
    this.name = "GoogleAdminLinkBlockedError";
  }
}

export async function verifyGoogleIdToken(
  credential: string,
): Promise<GoogleProfile> {
  // NOTE: Defense-in-depth. The /google route is conditionally registered when
  // googleOAuthEnabled is true, but this guard removes any ambiguity if the
  // function is reached via tests, refactors, or mutated config.
  if (!config.googleClientId) {
    throw new Error("Google OAuth is not configured");
  }
  const { payload } = await jwtVerify(credential, JWKS, {
    issuer: [...GOOGLE_ISSUERS],
    audience: config.googleClientId,
  });

  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Google ID token missing required claims");
  }

  return {
    sub,
    email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
  };
}

export async function upsertGoogleUser(
  profile: GoogleProfile,
): Promise<AuthUser> {
  const byGoogleId = await getUserByGoogleId(profile.sub);
  if (byGoogleId) {
    return byGoogleId;
  }

  // NOTE: Reject unverified Google emails before any account creation or
  // linking path so an unverified address cannot inherit ADMIN_SIGNUP_DOMAINS
  // promotion or pass the allowlist check.
  if (!profile.emailVerified) {
    throw new GoogleEmailNotVerifiedError();
  }

  const byEmail = await getUserByEmail(profile.email);
  if (byEmail) {
    // NOTE: If the existing account is already linked to a *different* Google
    // identity, refuse to relink. Otherwise a recycled workspace address (or a
    // second Google identity sharing the same email) could take over the
    // account silently.
    if (byEmail.googleId && byEmail.googleId !== profile.sub) {
      throw new GoogleIdMismatchError();
    }
    // NOTE: An ADMIN row that has never logged in is almost always one that an
    // operator pre-created via `bun set-admin <email>`. Allowing first-time
    // Google linking on such a row would let anyone holding email_verified=true
    // for that address (e.g. a Workspace admin or insider) take over the
    // account. Require at least one password login to prove inbox control
    // before Google linking becomes available for ADMIN accounts.
    if (byEmail.role === "ADMIN" && byEmail.lastLoginAt === null) {
      throw new GoogleAdminLinkBlockedError();
    }
    const linked = await linkGoogleIdToUser(byEmail.id, profile.sub);
    if (!linked) {
      throw new GoogleIdMismatchError();
    }
    return linked;
  }

  if (!isEmailDomainAllowed(profile.email)) {
    throw new GoogleEmailDomainNotAllowedError();
  }

  // NOTE: Two parallel first-time sign-ins for the same Google account can
  // both pass the read checks above and race on insert. Catch the unique
  // constraint conflict and re-resolve via googleId so the loser succeeds.
  try {
    return await createGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name,
    });
  } catch (error) {
    const existing = await getUserByGoogleId(profile.sub);
    if (existing) return existing;
    throw error;
  }
}
