/// <reference lib="dom" />

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, cleanup, render } from "@testing-library/react";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SidebarProvider,
  useSidebar,
} from "@/client/contexts/SidebarContext";

let hookValue: ReturnType<typeof useSidebar> | null = null;

function Consumer() {
  hookValue = useSidebar();
  return null;
}

function renderProvider() {
  return render(
    <SidebarProvider>
      <Consumer />
    </SidebarProvider>,
  );
}

describe("SidebarContext", () => {
  beforeEach(() => {
    localStorage.clear();
    hookValue = null;
  });

  afterEach(() => {
    cleanup();
  });

  test("initializes with defaults when no storage", () => {
    renderProvider();
    expect(hookValue?.collapsed).toBe(false);
    expect(hookValue?.width).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(hookValue?.mobileOpen).toBe(false);
  });

  test("reads collapsed from localStorage", () => {
    localStorage.setItem("@app:sidebar-collapsed", "true");
    renderProvider();
    expect(hookValue?.collapsed).toBe(true);
  });

  test("reads width from localStorage and clamps to range", () => {
    localStorage.setItem("@app:sidebar-width", "999");
    renderProvider();
    expect(hookValue?.width).toBe(SIDEBAR_MAX_WIDTH);

    cleanup();
    localStorage.setItem("@app:sidebar-width", "10");
    renderProvider();
    expect(hookValue?.width).toBe(SIDEBAR_MIN_WIDTH);
  });

  test("toggleCollapsed flips and persists", () => {
    renderProvider();
    act(() => hookValue?.toggleCollapsed());
    expect(hookValue?.collapsed).toBe(true);
    expect(localStorage.getItem("@app:sidebar-collapsed")).toBe("true");

    act(() => hookValue?.toggleCollapsed());
    expect(hookValue?.collapsed).toBe(false);
    expect(localStorage.getItem("@app:sidebar-collapsed")).toBe("false");
  });

  test("setCollapsed sets explicit state and persists", () => {
    renderProvider();
    act(() => hookValue?.setCollapsed(true));
    expect(hookValue?.collapsed).toBe(true);
    expect(localStorage.getItem("@app:sidebar-collapsed")).toBe("true");

    act(() => hookValue?.setCollapsed(false));
    expect(hookValue?.collapsed).toBe(false);
    expect(localStorage.getItem("@app:sidebar-collapsed")).toBe("false");
  });

  test("setWidth clamps and persists", () => {
    renderProvider();
    act(() => hookValue?.setWidth(9999));
    expect(hookValue?.width).toBe(SIDEBAR_MAX_WIDTH);
    expect(localStorage.getItem("@app:sidebar-width")).toBe(
      String(SIDEBAR_MAX_WIDTH),
    );

    act(() => hookValue?.setWidth(0));
    expect(hookValue?.width).toBe(SIDEBAR_MIN_WIDTH);
    expect(localStorage.getItem("@app:sidebar-width")).toBe(
      String(SIDEBAR_MIN_WIDTH),
    );

    act(() => hookValue?.setWidth(300));
    expect(hookValue?.width).toBe(300);
  });

  test("setMobileOpen toggles mobile state", () => {
    renderProvider();
    act(() => hookValue?.setMobileOpen(true));
    expect(hookValue?.mobileOpen).toBe(true);

    act(() => hookValue?.setMobileOpen(false));
    expect(hookValue?.mobileOpen).toBe(false);
  });

  test("falls back to default width when storage value is not a number", () => {
    localStorage.setItem("@app:sidebar-width", "not-a-number");
    renderProvider();
    expect(hookValue?.width).toBe(SIDEBAR_DEFAULT_WIDTH);
  });

  test("reads collapsed=false for any non-'true' stored value", () => {
    localStorage.setItem("@app:sidebar-collapsed", "garbage");
    renderProvider();
    expect(hookValue?.collapsed).toBe(false);
  });

  test("keeps state updates even when localStorage.setItem throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
    try {
      renderProvider();
      act(() => hookValue?.setCollapsed(true));
      expect(hookValue?.collapsed).toBe(true);
      act(() => hookValue?.setWidth(300));
      expect(hookValue?.width).toBe(300);
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  test("hashchange closes an open mobile drawer", () => {
    renderProvider();
    act(() => hookValue?.setMobileOpen(true));
    expect(hookValue?.mobileOpen).toBe(true);
    act(() => {
      window.dispatchEvent(new Event("hashchange"));
    });
    expect(hookValue?.mobileOpen).toBe(false);
  });
});
