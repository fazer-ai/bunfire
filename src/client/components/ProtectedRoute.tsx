import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Layout } from "@/client/components/Layout";
import { useAuth } from "@/client/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    const redirectTo = location.pathname + location.search;
    const loginUrl =
      redirectTo !== "/"
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : "/login";
    return <Navigate to={loginUrl} replace />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}
