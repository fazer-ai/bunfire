import { join } from "node:path";
import config from "@/config";

const DIST_HTML = join(process.cwd(), "dist", "index.html");
const INLINE_SCRIPT_RE = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

export function extractInlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];
  for (const match of html.matchAll(INLINE_SCRIPT_RE)) {
    const content = match[1] ?? "";
    if (!content.trim()) continue;
    const digest = new Bun.CryptoHasher("sha256")
      .update(content)
      .digest("base64");
    hashes.push(`'sha256-${digest}'`);
  }
  return hashes;
}

async function loadDistInlineScriptHashes(): Promise<string[]> {
  if (config.env !== "production") return [];
  try {
    return extractInlineScriptHashes(await Bun.file(DIST_HTML).text());
  } catch (err) {
    throw new Error(
      `CSP: could not read ${DIST_HTML} to compute inline script hashes (${
        err instanceof Error ? err.message : String(err)
      }). Run \`bun run build\` before starting the server in production.`,
    );
  }
}

function getCdnOrigin(): string | null {
  if (!config.cdnUrl) return null;
  try {
    const origin = new URL(config.cdnUrl).origin;
    return origin === config.publicUrl ? null : origin;
  } catch {
    if (config.env === "production") {
      throw new Error(
        `CSP: invalid CDN_URL "${config.cdnUrl}". Expected an absolute URL so CSP can allow the CDN origin.`,
      );
    }
    return null;
  }
}

const inlineScriptHashes = await loadDistInlineScriptHashes();
const cdnOrigin = getCdnOrigin();

export const cspDirectives: Record<string, string[]> = {
  scriptSrc: [
    "'self'",
    ...inlineScriptHashes,
    ...(cdnOrigin ? [cdnOrigin] : []),
  ],
  styleSrc: ["'self'", "'unsafe-inline'", ...(cdnOrigin ? [cdnOrigin] : [])],
  imgSrc: ["'self'", "data:", ...(cdnOrigin ? [cdnOrigin] : [])],
  fontSrc: ["'self'", "data:", ...(cdnOrigin ? [cdnOrigin] : [])],
  connectSrc: ["'self'", ...(cdnOrigin ? [cdnOrigin] : [])],
};
