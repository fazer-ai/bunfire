#!/usr/bin/env bun

const CONFLICT_PATTERN = /Found same keys with different values: ([\w.:-]+)/g;
const BINARY = "./node_modules/.bin/i18next";

export type I18nExtractConfig = { label: string; configPath: string };

export type I18nExtractResult = {
  exitCode: number;
  conflicts: Array<{ label: string; key: string }>;
};

export async function runI18nExtract(
  configs: I18nExtractConfig[],
  opts: { silent?: boolean } = {},
): Promise<I18nExtractResult> {
  const conflicts: I18nExtractResult["conflicts"] = [];
  let subprocessFailed = false;

  for (const { label, configPath } of configs) {
    const proc = Bun.spawn([BINARY, "--config", configPath], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, FORCE_COLOR: opts.silent ? "0" : "1" },
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    await proc.exited;

    if (!opts.silent) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }
    if (proc.exitCode !== 0) subprocessFailed = true;

    const seen = new Set<string>();
    for (const match of (stdout + stderr).matchAll(CONFLICT_PATTERN)) {
      const key = match[1];
      if (!key || seen.has(key)) continue;
      seen.add(key);
      conflicts.push({ label, key });
    }
  }

  if (conflicts.length > 0 && !opts.silent) {
    console.error(
      "\n\x1b[31mError:\x1b[0m i18n keys have conflicting default values:",
    );
    for (const { label, key } of conflicts) {
      console.error(`  - [${label}] ${key}`);
    }
    console.error(
      "\nEach key must use the same default value at every call site. Align the defaults, or use distinct keys.",
    );
  }

  return {
    exitCode: conflicts.length > 0 || subprocessFailed ? 1 : 0,
    conflicts,
  };
}

if (import.meta.main) {
  const result = await runI18nExtract([
    { label: "client", configPath: "i18next-parser.config.cjs" },
    { label: "api", configPath: "i18next-parser.api.config.cjs" },
  ]);
  process.exit(result.exitCode);
}
