import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/client/lib/utils";

type BaseInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
};

type PasswordToggleInputProps = BaseInputProps & {
  showPasswordToggle: true;
  type: "password";
};

type RegularInputProps = BaseInputProps & {
  showPasswordToggle?: false;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
};

type InputProps = PasswordToggleInputProps | RegularInputProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      errorMessage,
      helperText,
      showPasswordToggle,
      type,
      autoComplete,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const hasError = error || !!errorMessage;
    const descriptionId = useId();
    const hasDescription = !!errorMessage || !!helperText;
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            type={showPasswordToggle && showPassword ? "text" : type}
            autoComplete={
              showPasswordToggle
                ? (autoComplete ?? "new-password")
                : autoComplete
            }
            aria-invalid={hasError || undefined}
            aria-describedby={hasDescription ? descriptionId : undefined}
            className={cn(
              "w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-placeholder focus:outline-none focus:border-border-focus disabled:opacity-60",
              { "border-error": hasError, "pr-10": !!showPasswordToggle },
              className,
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              tabIndex={-1}
              aria-label={
                showPassword
                  ? t("common.hidePassword", "Hide password")
                  : t("common.showPassword", "Show password")
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {errorMessage && (
          <span id={descriptionId} className="block text-xs text-error mt-1">
            {errorMessage}
          </span>
        )}
        {helperText && !errorMessage && (
          <span
            id={descriptionId}
            className="block text-xs text-text-muted mt-1"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
