import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import packageInfo from "@/../package.json";
import { Card } from "@/client/components";

export function SettingsAboutPage() {
  const { t } = useTranslation();

  const links = [
    {
      label: "GitHub",
      href: "https://github.com/fazer-ai/bunfire",
    },
    {
      label: "Bun",
      href: "https://bun.sh",
    },
    {
      label: "Elysia",
      href: "https://elysiajs.com",
    },
    {
      label: "Radix UI",
      href: "https://www.radix-ui.com",
    },
  ];

  return (
    <Card>
      <h2 className="mb-1 font-semibold text-text-primary">
        {t("settings.about", "About")}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {t("settings.aboutHint", "Details about this template.")}
      </p>
      <dl className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-border border-b pb-3">
          <dt className="text-sm text-text-secondary">
            {t("settings.aboutName", "Name")}
          </dt>
          <dd className="font-mono text-sm text-text-primary">
            {packageInfo.name}
          </dd>
        </div>
        <div className="flex items-center justify-between border-border border-b pb-3">
          <dt className="text-sm text-text-secondary">
            {t("settings.aboutVersion", "Version")}
          </dt>
          <dd className="font-mono text-sm text-text-primary">
            {packageInfo.version}
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-text-secondary">
            {t("settings.aboutLinks", "Links")}
          </dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-tertiary px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
