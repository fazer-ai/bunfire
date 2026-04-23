# CLAUDE.md

**bunfire** is a full-stack TypeScript template using **Bun + Elysia + React 19 + Tailwind CSS v4** with JWT auth, Prisma/PostgreSQL, i18n, and Biome tooling.

## Applying this template to a new project

1. Create a new repo from this template and clone it
2. `bun install`
3. `bun setup` — renames all references (`package.json`, env vars, database identifiers) from `bunfire` to your repo's directory name
4. Update `public/index.html` — change the `<title>` to your project name
5. Update external links in the sidebar footer — edit `SUPPORT_LINK` and `SECONDARY_LINKS` in `src/client/lib/navigation.tsx` to point at your project's support channel, website, and repository. Set `SUPPORT_LINK = null` and/or empty `SECONDARY_LINKS = []` to hide either block; when both are empty the footer does not render.
6. Remove pages you don't need:
   - **Signup page**: delete `src/client/pages/SignupPage.tsx`, remove its route from `src/client/App.tsx`, and remove the `/api/auth/signup` endpoint in `src/api/features/auth/`
   - **Admin page**: delete `src/client/pages/AdminPage.tsx`, remove its route from `src/client/App.tsx`, and remove `src/api/features/admin/` along with its mount in `src/app.ts`
   - **Google Sign-In**: see "Google OAuth (optional)" below to enable or remove
7. Re-generate this file with `/init` to get a CLAUDE.md tailored to your new project

## Google OAuth (optional)

Google Sign-In is wired via Google Identity Services (One Tap popup + official button) and disabled by default. When `GOOGLE_CLIENT_ID` is not set, the button is hidden and the backend `POST /api/auth/google` returns 404.

### Enable

1. Create an OAuth 2.0 Client ID (type **Web application**) at <https://console.cloud.google.com/apis/credentials>
2. Add your Authorized JavaScript origins (e.g. `http://localhost:3000` in dev, your production domain in prod). No redirect URI is needed; GIS does not use one.
3. Copy the client ID into `.env` as `GOOGLE_CLIENT_ID=...`. No client secret is required: the backend verifies the ID token against Google's JWKS.
4. Restart `bun dev`. The button and One Tap prompt appear on the login and signup pages.

On first sign-in, a new user is created with `password_hash: NULL` and `role: USER`. If a user already exists with the same email, the Google account is linked to that user (requires Google's `email_verified` to be `true`).

### Remove completely

- Delete `src/api/features/auth/google.service.ts`, `src/client/lib/google.ts`, `src/client/components/GoogleSignInButton.tsx`, `src/client/hooks/useGoogleSignIn.ts`
- If no other code uses it, delete `src/client/lib/types.ts` (it was introduced for `ApiErrorPayload` shared between Login/Signup)
- Remove the `POST /auth/google` route and the `providers` field in `GET /auth/me` from `src/api/features/auth/auth.controller.ts`
- Drop the Google-related helpers (`getUserByGoogleId`, `createGoogleUser`, `linkGoogleIdToUser`) from `src/api/features/auth/auth.service.ts`
- Revert the Prisma schema: restore `passwordHash` to non-nullable, drop the `googleId` field, drop the `users_auth_method_check` constraint, and write a new migration (`ALTER TABLE "users" DROP CONSTRAINT "users_auth_method_check"; ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL; ALTER TABLE "users" DROP COLUMN "google_id";`)
- Remove the Google button, `handleGoogleCredential`, and `useGoogleSignIn` import + usage from `LoginPage.tsx` and `SignupPage.tsx`, and the `providers` state from `AuthContext.tsx`
- Remove `GOOGLE_CLIENT_ID` from `.env.example`, `googleClientId`/`googleOAuthEnabled` from `src/config.ts`
- `bun remove jose`
- Remove `auth.or`, `auth.googleSignInFailed` from client locales and `errors.googleSignInFailed` from api locales
- Delete `tests/api/features/auth/google.service.test.ts`

## Restricting registration by email domain

The `ALLOWED_SIGNUP_DOMAINS` env var gates which email domains can register new accounts. It accepts a comma-separated list (e.g. `example.com,acme.io`). Leave empty to allow any domain (the default).

The gate applies to both `POST /api/auth/signup` (email/password) and first-time Google Sign-In via `POST /api/auth/google`. Existing users are never affected: login and account linking skip the check so pre-existing accounts keep working even if their domain is later removed from the allowlist.

## Auto-promoting admins by email domain

The `ADMIN_SIGNUP_DOMAINS` env var auto-promotes new accounts from listed domains to `ADMIN` on signup. It accepts a comma-separated list (e.g. `mycompany.io`). Leave empty for no auto-promotion (the default).

Auto-promotion only fires when the email address has been verified by a trusted channel: first-time Google Sign-In with `email_verified: true`. Password signups via `POST /api/auth/signup` are always created as `USER` even if their domain matches, because there is no proof the registrant controls the address. If you need an admin from a password account, promote them manually with `bun set-admin <email>`. Only affects account creation: existing users keep their current role even if their domain is later added to the list. If `ALLOWED_SIGNUP_DOMAINS` is set, admin domains must be in the allowlist as well (otherwise registration fails before role assignment).

**Threat model.** "The user controls this email address" is not the same as "the user is entitled to ADMIN in this application". Anyone who can obtain a Google ID token with `email_verified: true` for a listed domain becomes ADMIN on first sign-in. That includes:

- Any Google Workspace admin of the listed domain, who can provision arbitrary `@yourdomain` addresses at will.
- Any insider with a legitimate account in that Workspace, including ones who become malicious.
- Anyone who compromises the Workspace admin credentials or the domain's DNS.
- Anyone who exploits a Google provisioning bug (this category has had CVEs historically).

Only enable `ADMIN_SIGNUP_DOMAINS` when the group that operates the Google Workspace is the same group that should have admin control over the application. For everything else, leave it empty and promote admins explicitly with `bun set-admin`.

To narrow the takeover window for `bun set-admin`-created accounts, the Google linking flow refuses to attach a Google identity to an `ADMIN` row that has never logged in. The pre-created admin must complete a password login at least once before Google linking becomes available for that account.

## Routing: HashRouter (workaround)

`BrowserRouter` would be preferred, but the template uses `HashRouter` in `src/client/App.tsx` because Elysia does not render Bun HTML imports from dynamic handlers: `.get("/path", () => html)` returns `{}` instead of HTML, only `.get("/path", html)` (static form) renders. A `BrowserRouter` SPA fallback needs the dynamic form, so it would swallow legitimate `/api/*` and `/assets/*` 404s. Confirmed on Elysia 1.4.10 through 1.4.28, this is not a regression waiting for a release. [elysiajs/elysia#1771](https://github.com/elysiajs/elysia/issues/1771) tracked a related static-path regression, not this.

**Only during first-time template setup**, verify whether this changed: in a temp dir, install the project's Elysia version, register static + arrow + function handlers returning an HTMLBundle import, fetch each, and confirm all three return HTML with the expected marker. Issue/PR state is not a reliable gate, only the runtime smoke test is. If it passes, ask the user before migrating and ensure any SPA fallback guards `/api/*` and asset prefixes.

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
- Only `ProtectedRoute` (in `src/client/components/ProtectedRoute.tsx`) should render `<Layout>` — it is the single source of the app shell
- `<Layout>` composes `<Header>` (logo, mobile hamburger, `<UserMenu>`) + `<Sidebar>` (desktop aside or Radix Dialog drawer on mobile) + `<main>`. Navigation items are defined centrally in `src/client/lib/navigation.tsx`
- `<UserMenu>` (`src/client/components/UserMenu.tsx`) is the single entry point for user-level actions: theme picker, language picker, Settings shortcut, logout. Do not add those controls to the header or sidebar directly
- `<Sidebar>` exposes a footer block (`SidebarFooter`) with external links (support / website / repo), configured via `SUPPORT_LINK` and `SECONDARY_LINKS` in `src/client/lib/navigation.tsx`. The footer is pinned below the scrollable nav, collapses to icon-only with tooltips when the sidebar is collapsed, and does not render if both constants are empty/null. Icons come from `lucide-react` except GitHub, which uses the inlined Octocat in `src/client/components/icons/GithubIcon.tsx` (lucide 1.8 does not export a GitHub glyph)
- `<SidebarProvider>` (`src/client/contexts/SidebarContext.tsx`) owns sidebar state: `collapsed` and `width` persisted in `localStorage` under `@app:sidebar-*`, plus `mobileOpen` for the drawer. Keyboard shortcut Cmd/Ctrl+B toggles collapse (via `useSidebarShortcut`)
- `<TooltipProvider>` wraps the app in `App.tsx`; any `<Tooltip>` call (`src/client/components/Tooltip.tsx`) inherits a 200ms delay. `<Modal>`, `<Tooltip>`, `<Toast>`, `<Sidebar>` mobile drawer and `<UserMenu>` are all thin wrappers over Radix primitives (`@radix-ui/react-{dialog,tooltip,toast,dropdown-menu}`) to get focus trap, collision detection, and ARIA correctness for free
- `<PageContainer>` (`src/client/components/PageContainer.tsx`) is the single source of page-level max-width and horizontal centering. Every top-level page in `src/client/pages/*.tsx` must wrap its root JSX in `<PageContainer>`. Accepts `size="narrow" | "wide" | "full"` (default `"wide"`): `narrow` = `max-w-3xl` (forms, settings, reading), `wide` = `max-w-7xl` (dashboards, tables), `full` = no max-width (ultrawide tables, canvas). This rule is enforced by `biome-plugins/require-page-container.grit`, scoped to `src/client/pages/*.tsx`. Sub-pages under a layout route (e.g. `src/client/pages/settings/*.tsx`) are out of scope because their parent layout already wraps `<Outlet />` in `<PageContainer>`. Auth pages (Login, Signup) suppress the rule with `// biome-ignore lint/plugin: <reason>` because they render outside the main app shell

## Modals

The `<Modal>` component in `src/client/components/Modal.tsx` is the canonical wrapper for Radix Dialog. State is owned by a controller hook in the parent, and descendants pick it up via context. The shape:

```tsx
const modal = useModalController<License>();          // parent owns state

<Button onClick={() => modal.open(license)}>Open</Button>
<LicenseModal modal={modal} />                        // ALWAYS rendered

function LicenseModal({ modal }: { modal: ModalController<License> }) {
  return (
    <Modal modal={modal} title="Attach license">
      <Body />
    </Modal>
  );
}

function Body() {
  const { payload: license, close } = useModal<License>();   // any descendant
  // ...
}
```

Rules:

- **Always render the `<Modal>`, never `{flag && <Modal/>}`**. Radix keeps `Dialog.Root` alive through the exit animation via its internal `Presence` component. Unmounting the root skips the animation and snaps the modal closed. (This is why the `HelpFab` in older code animated correctly while newer wrappers didn't.)
- **`useModalController<T>(opts?)`** returns `{ isOpen, payload, open, close }`. `payload` is retained across `close()` so the body can keep rendering real data while Radix plays the exit animation; it's only overwritten on the next `open()`. Don't clear it in `close()`.
- **`useModal<T>()`** is the descendant hook. Reads the controller from context that `<Modal>` provides. Use it in body/footer/submodals to avoid prop drilling. Throws if used outside a `<Modal modal={...}>` subtree.
- **`useOnModalOpen(modal, effect)`** fires `effect` each time the controller's `isOpen` transitions from `false` to `true` (with optional cleanup on close). Use it for per-open state resets (form defaults, prefilled fields, etc.). It takes the controller directly (not `modal.isOpen`) because the hook is typically called in the wrapper component *before* `<Modal>` mounts its context provider; tried the context-only variant but it crashes at runtime for that reason. Don't reach for `useEffect(..., [modal.isOpen])` by hand — `useOnModalOpen` makes the intent explicit and is the pattern the biome plugin recognizes.
- **Reset state on the next open, not in the close handler.** Flipping disclosure/expansion state (`showAdvanced`, `isExpanded`, form sections) synchronously inside the close callback runs during Radix's exit animation, so the panel snaps shut mid-fade (visible flicker). Push those resets into `useOnModalOpen` instead; the modal is hidden between close and the next open, so the reset is invisible. This is also why `close()` on the controller does not clear `payload` — Radix needs to keep rendering real data through the animation.
- **`closeOnOutsideClick={false}`** for flows where accidental dismiss is costly (pricing, checkout, destructive confirmation). Esc still closes.
- **`onCloseRequest`** intercepts user-driven close (Esc, outside click, X). The handler is responsible for eventually calling `modal.close()` (or not), typically after a confirmation submodal. Programmatic `modal.close()` calls from the parent are unaffected.

Nested modals stack automatically: `<Modal>` reads a depth from context and computes its `z-index` as `calc(var(--z-modal) + depth * 2)`. The overlay sits one step below the content. A warning fires once nesting depth reaches 5 (which collides with `--z-toast` at 90). If you need deeper nesting, bump the z-index tokens in `public/index.css` instead of silencing the warning.

Enforced by `biome-plugins/always-render-modal.grit` (scoped to `src/client/**`): any JSX element whose name matches `*Modal` (or the bare `<Modal>`) wrapped in a `{cond && ...}` short-circuit or a `{cond ? ... : null}` ternary fails lint. The plugin rejects the unmount-on-close anti-pattern directly; the fix is to lift state into `useModalController` and always render the wrapper.

### Modal + async flows (future guidance)

The template's two modals (HomePage playground and `SupportModal`) are sync; the patterns below aren't needed for them. They come from ~7 rounds of review on heavily-async modals in a downstream project and are worth reaching for once a modal starts fetching or mutating on the backend. Keep the list by your side when you add the first "modal that makes an API call" to your app.

- **Drop stale responses with a session token.** Bump a `sessionRef = useRef(0)` in `useOnModalOpen` (and inside any action that re-fetches). Async callbacks capture the current token; on return, bail if `sessionRef.current` changed. Prevents close+reopen races and payload switches from flashing wrong data or spawning child modals for the wrong entity.
- **Parent close invalidates nested state.** When a modal owns child modals (parent opens a nested one while open), return a cleanup from `useOnModalOpen` that bumps the session token and calls `child.close()`. Without this, child dialogs linger past the parent session.
- **Guard user-driven close while loading.** During an in-flight request, set `onCloseRequest` to a no-op (or a confirmation) AND `disabled={loading}` on Cancel/Confirm/row triggers. The typical bug this catches: a stale `onSuccess` firing and closing a freshly reopened session.
- **Confirm modals: close only on success.** Handlers for confirm-delete/detach/disable return `boolean`; the parent closes the confirm modal only on `true`. Failures stay on-screen so the user can retry without re-opening.
- **Skip resync effects when closing.** If the parent effect that writes into the modal's state runs during close (typical on a refetch-on-data-change pattern), guard it with `if (!isOpen) return`. Otherwise a late fetch can resurrect a modal mid-animation.
- **`useOnModalOpen` + `useEffect([payload.id])` together.** `useOnModalOpen` catches reopen transitions only. For modals that stay open across in-place payload swaps (`open(newPayload)` without closing first), pair it with a `useEffect` keyed on the payload's identity so state resets in both cases.
- **Force re-fetch on reopen by listing `modal.isOpen` in `fetchData` deps.** The instance-id / user-id driving `fetchData` stays the same across close+reopen, so a naive `useCallback([id])` won't re-run. Include `modal.isOpen` in the dep list (and in the effect that calls it) so the false→true transition re-fires the fetch. A separate `fetchCounter` ref bumped in `useOnModalOpen` works too, but double-fires when the id also changes in a separate render pass — prefer `modal.isOpen` alone.
- **Reset state synchronously with `useLayoutEffect`.** For state that would flash the previous session's content during the close→reopen paint window (e.g. `loading`, `products`, `error`), reset it from `useLayoutEffect` keyed on `isOpen` instead of `useEffect`. Also bump any `fetchSessionRef` in the same layout effect so in-flight requests from the prior session are invalidated before the new paint commits.
- **URL-driven auto-open is mount-only.** Effects that open a modal from a URL param (`?cart=1` → open acquire modal) should run once on mount (`[]` deps). Including the modal controller in deps re-runs on every open/close.
- **Check the `{ error }` branch from the typed client.** Elysia's typed client returns `{ data, error }` from mutations. Inside a modal's submit handler, inspect `error` explicitly, surface the API message, and do NOT close the modal on error.
- **Prefer titled modals.** Every modal in practice ended up with a title; `ariaLabel`-only flows needed shims and drifted visually. The template keeps `title?: string` optional for flexibility, but the default answer is "give it a title".

## Frontend env vars (`BUN_PUBLIC_*`)

- Env vars exposed to the client must be prefixed `BUN_PUBLIC_` and declared in `build.ts` under `define` (e.g. `"process.env.BUN_PUBLIC_CDN_URL": JSON.stringify(...)`). Without the `define` entry, the value is not inlined into the bundle
- All reads of `process.env.BUN_PUBLIC_*` in client code must live in `src/client/lib/env.ts` and nowhere else. The rest of the client imports the typed exports from that module. Reason: in production the `define` replacement eliminates the `process` reference, but in dev the browser has no `process` global, so a bare read throws a `ReferenceError` and breaks the module. `env.ts` wraps every read in a `try/catch` and is the only place that has to deal with that
- The `define` substitution is textual against the literal `process.env.BUN_PUBLIC_X`. Computed access (`process.env[key]`) does not get inlined, so each var must be read by its literal name in `env.ts`
- This rule is enforced by a Biome GritQL plugin at `biome-plugins/no-bun-public-env.grit`, scoped via `overrides` in `biome.jsonc` to `src/client/**` minus `env.ts`. Violations fail `bun lint`

## Theming

- All colors are CSS custom properties defined in the `@theme` block in `public/index.css` (dark mode defaults). Light mode overrides live in the `html[data-theme="light"]` block in the same file
- When adding a new color, always define both the dark value (in `@theme`) and the light value (in `html[data-theme="light"]`)
- Never use hardcoded Tailwind color classes (e.g. `bg-red-500`, `text-blue-100`) or hex values in components. Always use the CSS variable-based classes (`bg-error`, `text-accent`, `border-border`, etc.)
- For text on accent-colored backgrounds (e.g. primary buttons), use `text-accent-foreground` which flips between dark/light text per theme
- For theme-aware static assets (e.g. logos), use the `useThemedAsset` hook from `ThemeContext`. It appends `-light` before the file extension in light mode (e.g. `logo.png` becomes `logo-light.png`)
- The `ThemeProvider` wraps the entire app in `App.tsx`. Use `useTheme()` to access `{ theme, resolvedTheme, setTheme }`
- An inline script in `public/index.html` sets `data-theme` before React hydrates to prevent flash of wrong theme
- Theme preference is stored in localStorage under `@app:theme` (values: `auto`, `light`, `dark`)

## CSP

`src/app.ts` configures `elysia-helmet` with CSP always enabled. In production it enforces; in dev it runs in **Report-Only** mode (violations log to the browser console without blocking). Defaults from `elysia-helmet` cover `default-src`, `base-uri`, `form-action`, `frame-ancestors`, `object-src`, `script-src-attr`, and `upgrade-insecure-requests`. Directives set explicitly in `src/api/lib/csp.ts`: `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`.

Inline scripts in `public/index.html` (e.g. the theme-detection script) are allowed via a `'sha256-...'` entry added to `script-src`. In production, hashes are computed from `dist/index.html`; in dev, from `public/index.html`. Dev also adds `'unsafe-inline'`/`'unsafe-eval'` to `script-src` because the Bun dev server injects runtime scripts whose hash is not knowable from disk.

Google Sign-In (GSI) directives (`accounts.google.com` in `script-src`, `style-src`, `connect-src`, `frame-src`) are added automatically when `GOOGLE_CLIENT_ID` is set. They are omitted when GSI is disabled.

Same gate applies to `Cross-Origin-Opener-Policy`: `elysia-helmet`'s default is `same-origin`, which nulls `window.opener` in cross-origin popups and breaks GSI's "Continue with Google" button (`Cannot read properties of null (reading 'postMessage')`). When `GOOGLE_CLIENT_ID` is set, `src/app.ts` relaxes COOP to `same-origin-allow-popups`. Projects without GSI keep the stricter default. The One Tap prompt is unaffected either way because it runs in an iframe.

**IMPORTANT:** Any edit to an inline script requires `bun run build` before starting the server in production, otherwise the hash in the CSP header will not match the served HTML and the browser will block the script. The server fails loudly at boot in production if `dist/index.html` is missing. In dev, CSP violations for inline scripts appear as console warnings (Report-Only) without breaking the page.

When adding external dependencies (analytics, captcha, CDN), extend the relevant directives in `buildCspDirectives` (e.g. add the origin to `scriptSrc` / `connectSrc` / `frameSrc`). The dev Report-Only mode will surface any missing allowlist entries in the browser console during local development.

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
- Prefer `Bun.file(path).text()` / `Bun.file(path).json()` over `node:fs` for file reads — no other file in the repo imports `node:fs`, and the Bun API is idiomatic and supports both sync and async patterns cleanly
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
- Client code uses `t` from `useTranslation()`; backend code uses `translate()` from `src/api/lib/i18n.ts`. Do not cross-use: the two extractor configs (`i18next-parser.config.cjs` and `i18next-parser.api.config.cjs`) key off these exact names

### Lint guardrails

Three groups of lint rules catch common i18n mistakes early:

- **`noJsxLiterals`** (built-in, `style` category): flags bare string literals inside JSX (`<div>Hello</div>`) since those never reach the extractor. Disabled for `tests/**`. Genuine non-copy glyphs are listed in `allowedStrings` (e.g. `·`, `•`, `?`). For one-off exceptions use `// biome-ignore lint/style/noJsxLiterals: <reason>`
- **`no-dynamic-i18n-key.grit`** (`biome-plugins/`, scoped to `src/client/**`): flags `t($arg, ...)` where the first argument is not a string literal (e.g. `t(tab.labelKey)`, `` t(`foo.${x}`) ``, `t("a." + b)`). Dynamic keys escape extraction — add `// t('key.path', 'Default')` magic comments nearby, then suppress with `// biome-ignore lint/plugin/no-dynamic-i18n-key: extracted via magic comments in <source>`. Use the full plugin-name form so only this rule is muted on the next line; bare `lint/plugin:` would silence every biome plugin including `require-page-container` and `no-dynamic-translate-key`
- **`no-dynamic-translate-key.grit`** (`biome-plugins/`, scoped to `src/api/**`): same rule but for the backend `translate(...)` wrapper
- **`no-t-rename.grit`** (`biome-plugins/`, scoped to `src/client/**`): refuses `const { t: $alias } = useTranslation()` and `const $name = useTranslation()`. Keeps the canonical `t` name so the dynamic-key plugin can find the call sites

### Known limitations

GritQL has no scope analysis, so the dynamic-key check can be bypassed by:

- Passing `t` as a prop or callback (`<Child t={t} />` then `props.t(foo)`) — no AST-level detection possible
- Wrapping `t` in a helper (`const translate = t; translate(foo)`) — same issue
- Using `i18next.t(...)` directly instead of the hook — not in the pattern

Treat `bun i18n:extract` + the CI `git diff --exit-code src/client/locales/` gate in `.github/workflows/build-check.yml` as the final safety net. The linter catches the common cases at author time; the CI ensures no keys actually go missing.

## UX

- Always consider UX for backend requests: loading states, debouncing, error handling, and user feedback
