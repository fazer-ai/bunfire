import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import Elysia from "elysia";
import api from "@/api";
import logger from "@/api/lib/logger";
import {
  rateLimitMiddleware,
  staticRateLimitMiddleware,
} from "@/api/middlewares/rateLimit";
import config from "@/config";

const app = new Elysia()
  .onAfterResponse(({ request, set }) => {
    logger.info("%s %s [%s]", request.method, request.url, set.status);
  })
  .onError(({ path, error, code }) => {
    logger.error("%s\n%s", path, error);
    switch (code) {
      case "NOT_FOUND":
        return Response.redirect("/", 302);
      case "INTERNAL_SERVER_ERROR": {
        const message =
          config.env === "development"
            ? (error.stack ?? error.message)
            : "Something went wrong";
        return new Response(`${message}`, { status: 500 });
      }
      default:
    }
  })
  .use(rateLimitMiddleware())
  .use(staticRateLimitMiddleware())
  .use(
    await staticPlugin({
      assets: config.env === "production" ? "dist" : "public",
      prefix: "/",
      alwaysStatic: true,
    }),
  )
  .group("/api", (app) => app.use(api));

const parseOrigins = (originsStr: string): (string | RegExp)[] =>
  originsStr.split(",").map((origin) => {
    const trimmed = origin.trim();
    if (trimmed.startsWith("/") && trimmed.endsWith("/")) {
      const pattern = trimmed.slice(1, -1);
      return new RegExp(pattern);
    }
    return trimmed;
  });

if (config.env === "development") {
  app.use(cors());
} else {
  app.use(cors({ origin: parseOrigins(config.corsOrigin) }));
}

export type App = typeof app;
export default app;
