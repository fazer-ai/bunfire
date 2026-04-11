import { Elysia, t } from "elysia";
import {
  createUser,
  getUserByEmail,
  hashPassword,
  isEmailDomainAllowed,
  updateLastLogin,
  verifyPassword,
} from "@/api/features/auth/auth.service";
import {
  GoogleEmailDomainNotAllowedError,
  upsertGoogleUser,
  verifyGoogleIdToken,
} from "@/api/features/auth/google.service";
import { authPlugin } from "@/api/lib/auth";
import { translate } from "@/api/lib/i18n";
import logger from "@/api/lib/logger";
import config from "@/config";

export const authController = new Elysia({ prefix: "/auth" })
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
  })
  .post(
    "/google",
    async ({ body, set, setAuthCookie }) => {
      if (!config.googleOAuthEnabled) {
        set.status = 404;
        return { error: "Not found" };
      }

      try {
        const profile = await verifyGoogleIdToken(body.credential);
        const user = await upsertGoogleUser(profile);
        await setAuthCookie(user);
        updateLastLogin(user.id);

        return {
          user: {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        logger.warn({ error }, "Google sign-in failed");
        if (error instanceof GoogleEmailDomainNotAllowedError) {
          set.status = 400;
          return {
            error: translate(
              "errors.emailDomainNotAllowed",
              "Email domain is not allowed",
            ),
          };
        }
        // NOTE: GoogleEmailNotVerifiedError and GoogleIdMismatchError fall
        // through to the generic 401 below on purpose, so we don't leak
        // whether an account exists or how it is linked.
        set.status = 401;
        return {
          error: translate(
            "errors.googleSignInFailed",
            "Google sign-in failed",
          ),
        };
      }
    },
    {
      body: t.Object({
        credential: t.String({ minLength: 1 }),
      }),
    },
  );
