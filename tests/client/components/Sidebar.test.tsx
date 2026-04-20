/// <reference lib="dom" />

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

const mockUser = { role: "USER" as string };

mock.module("@/client/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

mock.module("@/client/contexts/ThemeContext", () => ({
  useThemedAsset: (path: string) => path,
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: () => {},
  }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

import { Sidebar } from "@/client/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/client/contexts/SidebarContext";

let hook: ReturnType<typeof useSidebar> | null = null;
function Probe() {
  hook = useSidebar();
  return null;
}

function renderSidebar(initialPath = "/") {
  return render(
    <TooltipPrimitive.Provider>
      <SidebarProvider>
        <Probe />
        <MemoryRouter initialEntries={[initialPath]}>
          <Sidebar />
        </MemoryRouter>
      </SidebarProvider>
    </TooltipPrimitive.Provider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser.role = "USER";
    hook = null;
  });

  afterEach(() => {
    cleanup();
  });

  test("renders Home link for regular users", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
  });

  test("hides Admin link for non-admin users", () => {
    renderSidebar();
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  test("shows Admin link for ADMIN role", () => {
    mockUser.role = "ADMIN";
    renderSidebar();
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
  });

  test("marks current route with aria-current=page", () => {
    mockUser.role = "ADMIN";
    renderSidebar("/admin");
    const adminLink = screen.getByRole("link", { name: /admin/i });
    expect(adminLink).toHaveAttribute("aria-current", "page");
  });

  test("has collapse/expand toggle button", () => {
    renderSidebar();
    const toggles = screen.getAllByRole("button", { name: /collapse|expand/i });
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });

  describe("mobile drawer", () => {
    test("is not mounted when mobileOpen is false", () => {
      renderSidebar();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("mounts a dialog when mobileOpen becomes true", () => {
      renderSidebar();
      act(() => {
        hook?.setMobileOpen(true);
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("exposes close button with accessible name", () => {
      renderSidebar();
      act(() => {
        hook?.setMobileOpen(true);
      });
      expect(
        screen.getByRole("button", { name: /close menu/i }),
      ).toBeInTheDocument();
    });

    test("logo link inside drawer closes the drawer on click", () => {
      renderSidebar();
      act(() => {
        hook?.setMobileOpen(true);
      });
      const dialog = screen.getByRole("dialog");
      const logoLink = dialog.querySelector("a[href]") as HTMLAnchorElement;
      expect(logoLink).not.toBeNull();
      act(() => {
        fireEvent.click(logoLink);
      });
      expect(hook?.mobileOpen).toBe(false);
    });

    test("clicking a nav link closes the drawer", () => {
      mockUser.role = "ADMIN";
      renderSidebar();
      act(() => {
        hook?.setMobileOpen(true);
      });
      const dialog = screen.getByRole("dialog");
      const navLinks = dialog.querySelectorAll("nav a");
      const homeLink = Array.from(navLinks).find((a) =>
        /home/i.test(a.textContent ?? ""),
      ) as HTMLAnchorElement;
      expect(homeLink).toBeTruthy();
      act(() => {
        fireEvent.click(homeLink);
      });
      expect(hook?.mobileOpen).toBe(false);
    });
  });
});
