import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentType, KeyboardEvent, ReactNode, SVGProps } from "react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/client/components";
import { useTheme } from "@/client/contexts/ThemeContext";
import { LANGUAGES } from "@/client/lib/languages";
import { cn } from "@/client/lib/utils";

type ThemeOption = {
  value: "auto" | "light" | "dark";
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "auto", labelKey: "theme.auto", icon: Monitor },
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
];

interface RadioTileGroupProps<T extends string> {
  ariaLabel: string;
  options: readonly { value: T; render: () => ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// NOTE: APG radio pattern with roving tabindex + arrow/Home/End navigation.
// Space/Enter activates via the native button handler.
function useRovingRadioGroup<T extends string>(
  options: readonly { value: T }[],
  value: T,
  onChange: (value: T) => void,
) {
  const buttonsRef = useRef<Map<T, HTMLButtonElement>>(new Map());

  const registerButton = useCallback(
    (optionValue: T) => (el: HTMLButtonElement | null) => {
      if (el) {
        buttonsRef.current.set(optionValue, el);
      } else {
        buttonsRef.current.delete(optionValue);
      }
    },
    [],
  );

  const focusAndSelect = useCallback(
    (nextValue: T) => {
      onChange(nextValue);
      // NOTE: defer to next frame so React applies tabIndex updates before we move focus
      queueMicrotask(() => {
        buttonsRef.current.get(nextValue)?.focus();
      });
    },
    [onChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const count = options.length;
      if (count === 0) return;
      const currentIndex = options.findIndex((o) => o.value === value);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;

      let nextIndex: number | null = null;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (safeIndex + 1) % count;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (safeIndex - 1 + count) % count;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = count - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        const nextValue = options[nextIndex]?.value;
        if (nextValue !== undefined) focusAndSelect(nextValue);
      }
    },
    [options, value, focusAndSelect],
  );

  return { registerButton, onKeyDown };
}

function RadioTileGroup<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: RadioTileGroupProps<T>) {
  const { registerButton, onKeyDown } = useRovingRadioGroup(
    options,
    value,
    onChange,
  );

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: APG radio pattern; native input type=radio cannot host icon + label tiles
          <button
            key={option.value}
            ref={registerButton(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              {
                "border-accent bg-bg-hover text-text-primary": active,
                "border-border bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary":
                  !active,
              },
            )}
          >
            {option.render()}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsAppearancePage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themeOptions = THEME_OPTIONS.map((opt) => ({
    value: opt.value,
    render: () => {
      const Icon = opt.icon;
      return (
        <>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {/* biome-ignore lint/plugin: extracted via magic comments in UserMenu.tsx */}
          {t(opt.labelKey)}
        </>
      );
    },
  }));

  const languageOptions = LANGUAGES.map((lang) => ({
    value: lang.code,
    render: () => (
      <>
        <span className="text-base" aria-hidden="true">
          {lang.flag}
        </span>
        {lang.name}
      </>
    ),
  }));

  // NOTE: fallback guards against the group being empty if the value does not match any option
  const activeLanguage =
    languageOptions.find((o) => o.value === i18n.language)?.value ??
    languageOptions[0]?.value ??
    "en";

  return (
    <div className="@container grid @3xl:grid-cols-2 grid-cols-1 gap-4">
      <Card>
        <h2 className="mb-1 font-semibold text-text-primary">
          {t("theme.label", "Theme")}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {t(
            "settings.themeHint",
            "Choose light, dark, or follow your system.",
          )}
        </p>
        <RadioTileGroup
          ariaLabel={t("theme.label", "Theme")}
          options={themeOptions}
          value={theme}
          onChange={(next) => setTheme(next)}
          className="grid gap-2 sm:grid-cols-3"
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-text-primary">
          {t("language.label", "Language")}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {t("settings.languageHint", "Applies instantly across the app.")}
        </p>
        <RadioTileGroup
          ariaLabel={t("language.label", "Language")}
          options={languageOptions}
          value={activeLanguage}
          onChange={(next) => i18n.changeLanguage(next)}
          className="grid gap-2 sm:grid-cols-2"
        />
      </Card>
    </div>
  );
}
