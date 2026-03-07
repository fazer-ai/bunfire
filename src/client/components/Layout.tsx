import { LayoutDashboard, LogOut, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/client/contexts/AuthContext";
import { getAssetUrl } from "@/client/lib/utils";
import { LanguagePicker } from "./LanguagePicker";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <header className="bg-bg-secondary border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={getAssetUrl("/assets/logo.png")}
            alt="Logo"
            className="h-8 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-4">
          {user?.role === "ADMIN" &&
            (isAdminPage ? (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover border border-border rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("nav.home", "Home")}
                </span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover border border-border rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("nav.admin", "Admin")}
                </span>
              </Link>
            ))}

          <LanguagePicker />

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover border border-border rounded-lg transition-colors cursor-pointer"
              aria-label={t("auth.logout", "Logout")}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("auth.logout", "Logout")}
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
