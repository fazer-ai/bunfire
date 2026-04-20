import { useTranslation } from "react-i18next";
import { Badge, Card } from "@/client/components";
import { useAuth } from "@/client/contexts/AuthContext";

// t('common.name', 'Name')
// t('common.email', 'Email')
// t('common.role', 'Role')
// t('common.notAvailable', 'N/A')

export function SettingsProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const fallback = t("common.notAvailable", "N/A");

  const fields = [
    { label: t("common.email", "Email"), value: user?.email ?? fallback },
    { label: t("common.name", "Name"), value: user?.name ?? fallback },
  ];

  return (
    <Card>
      <h2 className="mb-1 font-semibold text-text-primary">
        {t("settings.profile", "Profile")}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {t(
          "settings.profileHint",
          "This information comes from your account. Editing is not wired up in the template.",
        )}
      </p>
      <dl className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <dt className="text-text-muted text-xs uppercase tracking-wide">
              {field.label}
            </dt>
            <dd className="text-sm text-text-primary">{field.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <dt className="text-text-muted text-xs uppercase tracking-wide">
            {t("common.role", "Role")}
          </dt>
          <dd>
            <Badge variant={user?.role === "ADMIN" ? "warning" : "secondary"}>
              {user?.role ?? fallback}
            </Badge>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
