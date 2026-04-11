import type { UserRole } from "@/../generated/prisma/client";
import type { AuthUser } from "@/api/lib/auth";
import prisma from "@/api/lib/prisma";
import config from "@/config";

function emailDomainMatches(email: string, domains: string[]): boolean {
  if (domains.length === 0) return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  // NOTE: Defensive normalization in case the configured list is mutated
  // outside of parseDomainList (e.g. tests).
  const normalized = new Set(
    domains
      .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
      .filter(Boolean),
  );
  return normalized.has(domain);
}

export function isEmailDomainAllowed(email: string): boolean {
  if (config.allowedSignupDomains.length === 0) return true;
  return emailDomainMatches(email, config.allowedSignupDomains);
}

// NOTE: `emailVerified` gates ADMIN promotion: password signups never count as
// verified, so anyone holding an admin-domain address still needs to confirm
// ownership via a verified channel (e.g. Google) before being elevated.
export function getSignupRoleForEmail(
  email: string,
  emailVerified: boolean,
): UserRole {
  if (!emailVerified) return "USER";
  return emailDomainMatches(email, config.adminSignupDomains)
    ? "ADMIN"
    : "USER";
}

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: {
      ...AUTH_USER_SELECT,
      passwordHash: true,
      googleId: true,
    },
  });
}

export async function getUserByGoogleId(
  googleId: string,
): Promise<AuthUser | null> {
  return prisma.user.findUnique({
    where: { googleId },
    select: AUTH_USER_SELECT,
  });
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<AuthUser> {
  return prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash,
      role: getSignupRoleForEmail(email, false),
    },
    select: AUTH_USER_SELECT,
  });
}

export async function createGoogleUser(params: {
  googleId: string;
  email: string;
  name: string | null;
}): Promise<AuthUser> {
  return prisma.user.create({
    data: {
      email: params.email.trim().toLowerCase(),
      googleId: params.googleId,
      name: params.name,
      role: getSignupRoleForEmail(params.email, true),
    },
    select: AUTH_USER_SELECT,
  });
}

export async function linkGoogleIdToUser(
  userId: bigint,
  googleId: string,
): Promise<AuthUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { googleId },
    select: AUTH_USER_SELECT,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function updateLastLogin(userId: bigint) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}
