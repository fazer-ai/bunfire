# bunfire

> An opinionated, batteries-included full-stack TypeScript template. **Bun** runtime, **Elysia** API, **React 19** UI, **Tailwind CSS v4** styling. Auth, Prisma, i18n, theming and CI baked in. Start shipping in minutes.

## Features

### ⚡ Runtime & Framework

- **[Bun](https://bun.sh/)** - ultra-fast JavaScript runtime with native TypeScript support
- **[Elysia](https://elysiajs.com/)** - high-performance web framework with end-to-end type safety
- **[React 19](https://react.dev/)** - latest React with React Router v7 for client-side routing
- **[Tailwind CSS v4](https://tailwindcss.com/)** - next-gen utility-first CSS framework

### 🔐 Authentication

- JWT-based authentication with secure HTTP-only cookies
- Password hashing using native Bun crypto
- User signup, login, logout, and session management
- Role-based access control (USER/ADMIN roles)
- Optional Google Sign-In via Google Identity Services
- Domain allowlist for signups and auto-promotion of admins by email domain
- Auth context provider for React with automatic session restoration

### 🗄️ Database

- **[Prisma](https://prisma.io/)** with PostgreSQL adapter
- Pre-configured User model with email/password and Google OAuth support
- Database migrations and type-safe client generation
- Docker Compose setup for local PostgreSQL development
- AES-GCM encryption helpers for sensitive JSON fields at rest

### 🌍 Internationalization (i18n)

- **[i18next](https://www.i18next.com/)** integration with React
- Backend i18n for API error messages
- Automatic browser language detection
- Pre-configured English and Portuguese locales
- i18next-parser for extracting translation keys

### 🎨 Theming

- Light/dark mode with system preference auto-detection
- Manual theme picker (auto, light, dark) persisted in localStorage
- CSS custom properties for all colors, with dark/light overrides in `public/index.css`
- `useThemedAsset` hook for theme-aware static assets (logos, images)
- No flash of wrong theme on page load (inline detection script)

### 🛡️ Security & Performance

- Rate limiting middleware (configurable per-route)
- CORS configuration with regex pattern support
- Separate rate limits for API and static assets
- Helmet for secure HTTP headers
- Environment-based security settings

### 📝 Logging

- **[Pino](https://getpino.io/)** logger with pretty printing for development
- Log rotation with pino-roll
- Request/response logging with sanitization
- Configurable log levels

### 🛠️ Developer Experience

- **[Biome](https://biomejs.dev/)** for linting and formatting
- **[Husky](https://typicode.github.io/husky/)** pre-commit hooks (lint, type-check, tests)
- Hot module reloading in development
- End-to-end type safety with Eden Treaty (Elysia client)
- Path aliases (`@/`) for clean imports
- TypeScript strict mode
- `ProtectedRoute` component as the single source for the app shell
- [Lucide](https://lucide.dev/) icons preinstalled

### 📦 Build & Deploy

- Custom build script with Tailwind CSS plugin
- Multi-stage Dockerfile that compiles the backend to a single binary via `bun build --compile`
- GitHub Actions for lint, type-check, tests and Docker image publishing on release
- Optional Cloudflare R2 + Worker pipeline for serving static assets via CDN
- Production-ready with minification and optimization

## Getting Started

Create a new repo using this template, and run the following commands:

```bash
bun install
bun setup

# Start the development server
bun dev
```

Then, access the app at `http://localhost:3000`.

## Available Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `bun dev`             | Start development server with hot reload |
| `bun start`           | Start production server                  |
| `bun build`           | Build for production                     |
| `bun test`            | Run tests with coverage                  |
| `bun lint`            | Check code with Biome                    |
| `bun format`          | Format code with Biome                   |
| `bun check`           | Lint + type-check + i18n + tests         |
| `bun setup`           | Initialize template for a new project    |
| `bun set-admin`       | Promote a user to admin role             |
| `bun prisma:migrate`  | Run database migrations                  |
| `bun prisma:generate` | Generate Prisma client                   |
| `bun i18n:extract`    | Extract translation keys                 |

## Project Structure

```
├── src/
│   ├── api/                 # Backend API (Elysia)
│   │   ├── features/        # Feature modules (auth, admin, health, i18n)
│   │   ├── lib/             # Shared utilities (auth, logger, prisma, crypto)
│   │   └── middlewares/     # Rate limiting, etc.
│   ├── client/              # Frontend React app
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Client utilities (api, i18n)
│   │   ├── locales/         # Translation files
│   │   └── pages/           # Page components
│   ├── app.ts               # Elysia app configuration
│   ├── config.ts            # Environment configuration
│   └── index.ts             # Entry point
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets and index.html
├── scripts/                 # Setup and utility scripts
├── workers/                 # Cloudflare Workers (CDN)
└── generated/               # Generated Prisma client
```

## Environment Variables

| Variable       | Description                  | Default                   |
| -------------- | ---------------------------- | ------------------------- |
| `NODE_ENV`     | Environment mode             | `development`             |
| `PORT`         | Server port                  | `3000`                    |
| `PUBLIC_URL`   | Public URL for the app       | `http://localhost:3000`   |
| `JWT_SECRET`   | Secret for JWT signing       | `change-me-in-production` |
| `CORS_ORIGIN`  | Allowed CORS origins         | `localhost:3000`          |
| `DATABASE_URL` | PostgreSQL connection string | -                         |
| `LOG_LEVEL`    | Pino log level               | `info`                    |

See `CLAUDE.md` for the full list, including optional Google OAuth, domain allowlisting and at-rest encryption.

## Roadmap

### 🚀 Performance

- [ ] Frontend bundle optimization
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Improved tree-shaking
- [ ] Multi-core support in production Dockerfile

### ✨ Features

- [ ] Server-Side Rendering (SSR)
- [ ] WebSocket support for real-time features
- [ ] OpenAPI / Swagger documentation for API endpoints
- [ ] Database seeding for development

## License

[MIT](LICENSE)
