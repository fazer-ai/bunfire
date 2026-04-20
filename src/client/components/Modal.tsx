import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/client/lib/utils";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
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
  description,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-(--z-modal-overlay) bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <DialogPrimitive.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-(--z-modal) flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-bg-secondary focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            sizeClasses[size],
            className,
          )}
        >
          {title && (
            <div className="flex shrink-0 items-center justify-between border-border border-b px-6 py-4">
              <DialogPrimitive.Title className="font-semibold text-text-primary text-xl">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                // t('common.close', 'Close')
                aria-label={t("common.close", "Close")}
                className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
          )}
          {description && (
            <DialogPrimitive.Description className="px-6 pt-4 text-sm text-text-secondary">
              {description}
            </DialogPrimitive.Description>
          )}
          <div
            className={cn("flex-1 overflow-y-auto", {
              "px-6 py-4": !!title,
            })}
          >
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-border border-t px-6 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
