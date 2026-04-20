import "@/public/index.css";
import "@/client/lib/i18n";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import { ProtectedRoute, ToastProvider } from "@/client/components";
import { AuthProvider } from "@/client/contexts/AuthContext";
import { SidebarProvider } from "@/client/contexts/SidebarContext";
import { ThemeProvider } from "@/client/contexts/ThemeContext";
import { AdminPage } from "@/client/pages/AdminPage";
import { HomePage } from "@/client/pages/HomePage";
import { LoginPage } from "@/client/pages/LoginPage";
import { SignupPage } from "@/client/pages/SignupPage";
import { SettingsAboutPage } from "@/client/pages/settings/SettingsAboutPage";
import { SettingsAppearancePage } from "@/client/pages/settings/SettingsAppearancePage";
import { SettingsLayout } from "@/client/pages/settings/SettingsLayout";
import { SettingsProfilePage } from "@/client/pages/settings/SettingsProfilePage";

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipPrimitive.Provider delayDuration={200}>
          <AuthProvider>
            <SidebarProvider>
              <HashRouter>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <HomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<SettingsProfilePage />} />
                    <Route
                      path="appearance"
                      element={<SettingsAppearancePage />}
                    />
                    <Route path="about" element={<SettingsAboutPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </HashRouter>
            </SidebarProvider>
          </AuthProvider>
        </TooltipPrimitive.Provider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
