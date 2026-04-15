// NOTE: This module is the only place in the client allowed to read
// `process.env.BUN_PUBLIC_*`. The literal `process.env.BUN_PUBLIC_X` is
// inlined at build time via `define` in `build.ts`; in dev the browser has
// no `process` global, so a bare read throws `ReferenceError`. Centralizing
// the access keeps the try/catch in one spot and lets the rest of the
// codebase consume typed exports.
let cdnUrl = "";
try {
  cdnUrl = (process.env.BUN_PUBLIC_CDN_URL || "").replace(/\/$/, "");
} catch {}

export const CDN_URL = cdnUrl;
