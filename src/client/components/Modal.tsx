import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/client/lib/utils";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  zIndex?: number;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  children,
  isOpen,
  onClose,
  title,
  footer,
  size = "md",
  className,
  zIndex = 50,
}: ModalProps) {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (
      mouseDownTarget.current === e.currentTarget &&
      e.target === e.currentTarget
    ) {
      onClose();
    }
    mouseDownTarget.current = null;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={cn(
          "bg-bg-secondary rounded-xl border border-border w-full relative flex flex-col max-h-[calc(100vh-2rem)]",
          sizeClasses[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div
          className={cn("overflow-y-auto flex-1", {
            "px-6 py-4": !!title,
          })}
        >
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
