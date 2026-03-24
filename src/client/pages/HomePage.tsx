import { useTranslation } from "react-i18next";
import { Card } from "@/client/components";
import { useAuth } from "@/client/contexts/AuthContext";
import { useThemedAsset } from "@/client/contexts/ThemeContext";
import { getAssetUrl } from "@/client/lib/utils";

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const logoPath = useThemedAsset("/assets/logo.png");

  return (
    <div className="mx-auto max-w-7xl text-center">
      <div className="mb-8 flex items-center justify-center gap-8">
        <img
          src={getAssetUrl(logoPath)}
          alt="Logo"
          className="h-24 scale-120 p-6 transition-all duration-300 hover:drop-shadow-accent"
        />
      </div>

      <Card className="mb-8 inline-block p-4">
        <p className="text-text-primary">
          {t("home.welcome", "Welcome, {{email}}!", { email: user?.email })}
        </p>
        <p className="text-sm text-text-muted">
          {t("home.role", "Role: {{role}}", { role: user?.role })}
        </p>
      </Card>
    </div>
  );
}
