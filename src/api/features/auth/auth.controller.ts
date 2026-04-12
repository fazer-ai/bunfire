import { Elysia, t } from "elysia";
import * as jose from "jose";
import {
  createUser,
  getUserByEmail,
  hashPassword,
  isEmailDomainAllowed,
  updateLastLogin,
  verifyPassword,
} from "@/api/features/auth/auth.service";
import {
  GoogleAdminLinkBlockedError,
  GoogleEmailDomainNotAllowedError,
  GoogleEmailNotVerifiedError,
  GoogleIdMismatchError,
  upsertGoogleUser,
  verifyGoogleIdToken,
} from "@/api/features/auth/google.service";
import { authPlugin } from "@/api/lib/auth";
import { translate } from "@/api/lib/i18n";
import logger from "@/api/lib/logger";
import config from "@/config";

const baseAuthController = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .post(
    "/signup",
    async ({ body, set, setAuthCookie }) => {
      const { email, password } = body;

      // NOTE: Look up the existing user first so users on a domain that was
      // later removed from ALLOWED_SIGNUP_DOMAINS still get the accurate
      // "email already in use" response instead of a misleading domain error.
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        set.status = 400;
        return {
          error: translate("errors.emailInUse", "Email already in use"),
        };
      }

      if (!isEmailDomainAllowed(email)) {
        set.status = 400;
        return {
          error: translate(
            "errors.emailDomainNotAllowed",
            "Email domain is not allowed",
          ),
        };
      }

      const passwordHash = await hashPassword(password);
      const user = await createUser(email, passwordHash);

      await setAuthCookie(user);

      return {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .post(
    "/login",
    async ({ body, set, setAuthCookie }) => {
      const { email, password } = body;

      const user = await getUserByEmail(email);
      if (!user?.passwordHash) {
        set.status = 401;
        return {
          error: translate(
            "errors.invalidCredentials",
            "Invalid email or password",
          ),
        };
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        set.status = 401;
        return {
          error: translate(
            "errors.invalidCredentials",
            "Invalid email or password",
          ),
        };
      }

      await setAuthCookie(user);
      void updateLastLogin(user.id).catch((error) => {
        logger.warn(
          { error, userId: user.id.toString() },
          "Failed to update last login",
        );
      });

      return {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .get("/me", async ({ getAuthUser }) => {
    const user = await getAuthUser();
    const providers = config.googleOAuthEnabled
      ? { google: { clientId: config.googleClientId } }
      : {};

    return {
      user: user
        ? {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        : null,
      providers,
    };
  })
  .post("/logout", ({ clearAuthCookie }) => {
    clearAuthCookie();
    return { success: true };
  });

const googleAuthController = baseAuthController.post(
  "/google",
  async ({ body, set, setAuthCookie }) => {
    try {
      const profile = await verifyGoogleIdToken(body.credential);
      const user = await upsertGoogleUser(profile);
      await setAuthCookie(user);
      void updateLastLogin(user.id).catch((error) => {
        logger.warn(
          { error, userId: user.id.toString() },
          "Failed to update last login",
        );
      });

      return {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof GoogleEmailDomainNotAllowedError) {
        logger.warn({ error }, "Google sign-in rejected: domain blocked");
        set.status = 400;
        return {
          error: translate(
            "errors.emailDomainNotAllowed",
            "Email domain is not allowed",
          ),
        };
      }
      // NOTE: GoogleEmailNotVerifiedError, GoogleIdMismatchError,
      // GoogleAdminLinkBlockedError, and jose's JWT/JWS verification failures
      // all map to a generic 401 so we don't leak whether an account exists,
      // how it is linked, or that it has elevated privileges.
      if (
        error instanceof GoogleEmailNotVerifiedError ||
        error instanceof GoogleIdMismatchError ||
        error instanceof GoogleAdminLinkBlockedError ||
        error instanceof jose.errors.JOSEError
      ) {
        logger.warn({ error }, "Google sign-in rejected");
        set.status = 401;
        return {
          error: translate(
            "errors.googleSignInFailed",
            "Google sign-in failed",
          ),
        };
      }
      // NOTE: Unexpected operational failures (Prisma, JWKS network, cookie
      // signing, etc.) bubble up so they surface as 5xx instead of getting
      // misreported as bad credentials.
      logger.error({ error }, "Unexpected error during Google sign-in");
      throw error;
    }
  },
  {
    body: t.Object({
      credential: t.String({ minLength: 1 }),
    }),
  },
);

// NOTE: When Google OAuth is disabled, the `/google` route is not registered at
// all so schema validation never runs and Elysia returns its standard 404.
// The exported type is always the enabled-mode controller so that the
// generated treaty client keeps `auth.google.post(...)` available; the
// frontend already gates calls behind `providers.google`.
export const authController: typeof googleAuthController =
  config.googleOAuthEnabled
    ? googleAuthController
    : (baseAuthController as unknown as typeof googleAuthController);
