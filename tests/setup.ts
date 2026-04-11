import { GlobalRegistrator } from "@happy-dom/global-registrator";
import "@testing-library/jest-dom";

GlobalRegistrator.register();

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
// NOTE: Force a deterministic Google client id so the auth controller registers
// `/auth/google` regardless of the developer's local `.env` and so tests can
// exercise the enabled-mode code path.
process.env.GOOGLE_CLIENT_ID = "test-google-client.apps.googleusercontent.com";
