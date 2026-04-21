import { describe, expect, test } from "bun:test";
import { buildBreadcrumbs } from "@/client/lib/breadcrumbs";

describe("breadcrumbs", () => {
  test("returns empty array on root", () => {
    expect(buildBreadcrumbs("/")).toEqual([]);
  });

  test("returns single crumb for top-level page", () => {
    const crumbs = buildBreadcrumbs("/admin");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toMatchObject({
      labelKey: "nav.admin",
      to: undefined,
    });
  });

  test("builds nested trail with links except the last", () => {
    const crumbs = buildBreadcrumbs("/settings/profile");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toMatchObject({
      labelKey: "settings.title",
      to: "/settings",
    });
    expect(crumbs[1]).toMatchObject({
      labelKey: "settings.profile",
      to: undefined,
    });
  });

  test("ignores unknown segments silently", () => {
    const crumbs = buildBreadcrumbs("/settings/unknown");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toMatchObject({
      labelKey: "settings.title",
      to: undefined,
    });
  });
});
