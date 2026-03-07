import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLanguageByCode, LANGUAGES } from "@/client/lib/languages";
import { cn } from "@/client/lib/utils";

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = getLanguageByCode(i18n.language);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover border border-border rounded-lg transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 min-w-40 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer",
                {
                  "bg-bg-hover text-text-primary":
                    lang.code === currentLang.code,
                  "hover:bg-bg-tertiary text-text-secondary":
                    lang.code !== currentLang.code,
                },
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
