import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/client/contexts/ThemeContext";
import { cn } from "@/client/lib/utils";

// t('theme.auto', 'Auto')
// t('theme.light', 'Light')
// t('theme.dark', 'Dark')
const THEMES = [
  { value: "auto" as const, icon: Monitor, labelKey: "theme.auto" },
  { value: "light" as const, icon: Sun, labelKey: "theme.light" },
  { value: "dark" as const, icon: Moon, labelKey: "theme.dark" },
];

function getButtonIcon(theme: string, resolvedTheme: string) {
  if (theme === "auto") return Monitor;
  if (resolvedTheme === "light") return Sun;
  return Moon;
}

export function ThemePicker() {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const ButtonIcon = getButtonIcon(theme, resolvedTheme);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 font-medium text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        aria-label={t("theme.auto", "Auto")}
      >
        <ButtonIcon className="h-4 w-4" />
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-lg">
          {THEMES.map(({ value, icon: Icon, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                {
                  "bg-bg-hover text-text-primary": value === theme,
                  "text-text-secondary hover:bg-bg-tertiary": value !== theme,
                },
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
