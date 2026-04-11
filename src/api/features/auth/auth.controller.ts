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

      if (!isEmailDomainAllowed(email)) {
        set.status = 400;
        return {
          error: translate(
            "errors.emailDomainNotAllowed",
            "Email domain is not allowed",
          ),
        };
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        set.status = 400;
        return {
          error: translate("errors.emailInUse", "Email already in use"),
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
      updateLastLogin(user.id);

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
