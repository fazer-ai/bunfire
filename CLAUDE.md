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
6. Re-generate this file with `/init` to get a CLAUDE.md tailored to your new project

## Common commands

| Command | Description |
|---|---|
| `bun dev` | Start dev server with hot reload (port 3000) |
| `bun build` | Build frontend assets to `dist/` |
| `bun test` | Run tests with coverage |
| `bun lint` | Lint with Biome |
| `bun format` | Format with Biome |
| `bun check` | Lint + type-check + i18n + tests |
| `bun prisma:migrate` | Run database migrations |
| `bun prisma:generate` | Generate Prisma client |
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
