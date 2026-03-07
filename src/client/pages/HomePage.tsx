import { useTranslation } from "react-i18next";
import { Card } from "@/client/components";
import { useAuth } from "@/client/contexts/AuthContext";
import { getAssetUrl } from "@/client/lib/utils";

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto text-center">
      <div className="flex justify-center items-center gap-8 mb-8">
        <img
          src={getAssetUrl("/assets/logo.png")}
          alt="Logo"
          className="h-24 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#3b82f6aa] scale-120"
        />
      </div>

      <Card className="mb-8 inline-block p-4">
        <p className="text-text-primary">
          {t("home.welcome", "Welcome, {{email}}!", { email: user?.email })}
        </p>
        <p className="text-text-muted text-sm">
          {t("home.role", "Role: {{role}}", { role: user?.role })}
        </p>
      </Card>
    </div>
  );
}
