# CLAUDE.md

This is a full-stack TypeScript template using **Bun + Elysia + React 19 + Tailwind CSS v4** with JWT auth, Prisma/PostgreSQL, i18n, and Biome tooling.

## Applying this template to a new project

1. Create a new repo from this template and clone it
2. `bun install`
3. `bun setup` — renames all references (`package.json`, env vars, database identifiers) from `bun-elysia-react-tailwind` to your repo's directory name
4. Update `public/index.html` — change the `<title>` to your project name
5. Remove pages you don't need:
   - **Signup page**: delete `src/client/pages/SignupPage.tsx`, remove its route from `src/client/App.tsx`, and remove the `/api/auth/signup` endpoint in `src/api/features/auth/`
   - **Admin page**: delete `src/client/pages/AdminPage.tsx`, remove its route from `src/client/App.tsx`, and remove `src/api/features/admin/` along with its mount in `src/app.ts`
   - **Google Sign-In**: see "Google OAuth (optional)" below to enable or remove
6. Re-generate this file with `/init` to get a CLAUDE.md tailored to your new project

## Google OAuth (optional)

Google Sign-In is wired via Google Identity Services (One Tap popup + official button) and disabled by default. When `GOOGLE_CLIENT_ID` is not set, the button is hidden and the backend `POST /api/auth/google` returns 404.

### Enable

1. Create an OAuth 2.0 Client ID (type **Web application**) at <https://console.cloud.google.com/apis/credentials>
2. Add your Authorized JavaScript origins (e.g. `http://localhost:3000` in dev, your production domain in prod). No redirect URI is needed; GIS does not use one.
3. Copy the client ID into `.env` as `GOOGLE_CLIENT_ID=...`. No client secret is required: the backend verifies the ID token against Google's JWKS.
4. Restart `bun dev`. The button and One Tap prompt appear on the login and signup pages.

On first sign-in, a new user is created with `password_hash: NULL` and `role: USER`. If a user already exists with the same email, the Google account is linked to that user (requires Google's `email_verified` to be `true`).

### Remove completely

- Delete `src/api/features/auth/google.service.ts`, `src/client/lib/google.ts`, `src/client/components/GoogleSignInButton.tsx`
- Remove the `POST /auth/google` route and the `providers` field in `GET /auth/me` from `src/api/features/auth/auth.controller.ts`
- Drop the Google-related helpers (`getUserByGoogleId`, `createGoogleUser`, `linkGoogleIdToUser`) from `src/api/features/auth/auth.service.ts`
- Revert the Prisma schema: restore `passwordHash` to non-nullable, drop the `googleId` field, write a new migration (`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL; ALTER TABLE "users" DROP COLUMN "google_id";`)
- Remove the Google button and `handleGoogleCredential` from `LoginPage.tsx` and `SignupPage.tsx`, and the `providers` state from `AuthContext.tsx`
- Remove `GOOGLE_CLIENT_ID` from `.env.example`, `googleClientId`/`googleOAuthEnabled` from `src/config.ts`
- `bun remove jose`
- Remove `auth.or`, `auth.googleSignInFailed` from client locales and `errors.googleSignInFailed` from api locales
- Delete `tests/api/features/auth/google.service.test.ts`

## Restricting registration by email domain

The `ALLOWED_SIGNUP_DOMAINS` env var gates which email domains can register new accounts. It accepts a comma-separated list (e.g. `example.com,acme.io`). Leave empty to allow any domain (the default).

The gate applies to both `POST /api/auth/signup` (email/password) and first-time Google Sign-In via `POST /api/auth/google`. Existing users are never affected: login and account linking skip the check so pre-existing accounts keep working even if their domain is later removed from the allowlist.

## Auto-promoting admins by email domain

The `ADMIN_SIGNUP_DOMAINS` env var auto-promotes new accounts from listed domains to `ADMIN` on signup. It accepts a comma-separated list (e.g. `mycompany.io`). Leave empty for no auto-promotion (the default).

Applies to both `POST /api/auth/signup` and first-time Google Sign-In. Only affects account creation: existing users keep their current role even if their domain is later added to the list. If `ALLOWED_SIGNUP_DOMAINS` is also set, admin domains must also be in the allowlist (otherwise registration fails before role assignment).

## Development setup

- Before configuring `DATABASE_URL` in `.env`, check for existing PostgreSQL instances by scanning ports (e.g. `ss -tlnp | grep 543` or similar). Use port 5432 as the default, but if it is already in use by another service, pick the next available port (5433, 5434, etc.) and set `POSTGRES_PORT` accordingly in `.env`

## Common commands

| Command                            | Description                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `bun dev`                          | Start dev server with hot reload (port 3000)                                             |
| `bun build`                        | Build frontend assets to `dist/`                                                         |
| `bun test`                         | Run tests with coverage                                                                  |
| `bun lint`                         | Lint with Biome                                                                          |
| `bun format`                       | Format with Biome                                                                        |
| `bun check`                        | Lint + type-check + i18n + tests                                                         |
| `bun prisma:migrate`               | Run database migrations                                                                  |
| `bun prisma:generate`              | Generate Prisma client                                                                   |
| `bun set-admin <email> [password]` | Promote a user to admin (creates the user if it doesn't exist; optionally sets password) |

## Project layout

- `src/api/` — Elysia backend (features/, lib/, middlewares/)
- `src/client/` — React frontend (pages/, components/, contexts/, lib/, locales/)
- `src/app.ts` — Elysia app setup
- `src/config.ts` — Environment config
- `prisma/` — Schema and migrations
- `public/` — Static assets and `index.html`
- `scripts/` — `setup.ts` (template init), `set-admin.ts`
- `build.ts` — Custom build script with Tailwind plugin

## Frontend architecture

- `ProtectedRoute` wraps children in `<Layout>` — page components must NOT wrap themselves in `<Layout>`, they render content only
- Only `ProtectedRoute` (in `src/client/components/ProtectedRoute.tsx`) should render `<Layout>` — it is the single source of the app shell (header, nav, main content area)

## Theming

- All colors are CSS custom properties defined in the `@theme` block in `public/index.css` (dark mode defaults). Light mode overrides live in the `html[data-theme="light"]` block in the same file
- When adding a new color, always define both the dark value (in `@theme`) and the light value (in `html[data-theme="light"]`)
- Never use hardcoded Tailwind color classes (e.g. `bg-red-500`, `text-blue-100`) or hex values in components. Always use the CSS variable-based classes (`bg-error`, `text-accent`, `border-border`, etc.)
- For text on accent-colored backgrounds (e.g. primary buttons), use `text-accent-foreground` which flips between dark/light text per theme
- For theme-aware static assets (e.g. logos), use the `useThemedAsset` hook from `ThemeContext`. It appends `-light` before the file extension in light mode (e.g. `logo.png` becomes `logo-light.png`)
- The `ThemeProvider` wraps the entire app in `App.tsx`. Use `useTheme()` to access `{ theme, resolvedTheme, setTheme }`
- An inline script in `public/index.html` sets `data-theme` before React hydrates to prevent flash of wrong theme
- Theme preference is stored in localStorage under `@app:theme` (values: `auto`, `light`, `dark`)

## Encryption

- `ENCRYPTION_KEY` env var is used to encrypt sensitive data at rest in the database (API tokens, secrets, credentials)
- Always use `encryptJson()` / `decryptJson()` from `src/api/lib/crypto.ts` when writing/reading sensitive JSON to/from Prisma `Json` fields
- The key must be set to a unique, strong value in production (min 32 characters recommended)
- Changing the key will invalidate all previously encrypted data. Plan a migration if key rotation is needed
- Never log, expose in API responses, or include in frontend bundles

## Code style

- Biome for linting and formatting (2-space indent, LF line endings)
- Path alias: `@/` maps to `src/`
- Strict TypeScript
- Husky pre-commit hooks run lint, type-check, and tests
- Always run `bun check` after applying all code changes to ensure code quality and correctness
- Only add comments when strictly necessary — never obvious/redundant ones. Comments must have a tag: `// TODO:`, `// NOTE:`, or `// FIXME:`
- **Cursor styles**: `cursor: pointer` is set globally on `button`, `select`, `[role="button"]` in `public/index.css` — never use `cursor-pointer` on individual elements. Only use cursor utilities for overrides like `cursor-not-allowed` on disabled states
- Use the `cn` utility for component classNames. For conditional classNames, use object syntax `cn("base", { "active": isActive })` — not ternary operators
- Add `aria-*` attributes for accessibility on interactive elements
- Always check `.env.example` when adding new environment variables to ensure consistency

## Branding

- "fazer.ai" is always lowercase. "fazer-ai" is acceptable in slugs/identifiers. Never "Fazer.ai" or "Fazer.AI"

## i18n

- Always update localization keys when adding or modifying user-facing text
- Never add keys manually to localization files — use `bun i18n:extract`
- Use magic comments like `// t('translation.key', 'Translation')` for localization keys inside static objects without access to `t`
- Always update non-English localization files with correct translations

## UX

- Always consider UX for backend requests: loading states, debouncing, error handling, and user feedback
