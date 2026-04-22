import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/client/lib/utils";

// NOTE: nested modals resolve their z-index at runtime via
// `calc(var(--z-modal) + depth * step)` so the base value stays defined in
// one place (public/index.css). Each level adds MODAL_DEPTH_STEP to the
// content; the overlay sits one below its content so it dims the parent
// content without escaping to the next layer above. At depth 0 the Tailwind
// z-token classes below are used unchanged, which preserves the 10-unit gap
// between --z-modal-overlay (70) and --z-modal (80). At depth >0 the gap
// between overlay and content collapses to 1; this is only a problem if a
// new z-indexed layer is ever introduced between a content and its own
// nested overlay, which does not happen with the current token set.
const MODAL_DEPTH_STEP = 2;
// NOTE: with base 80 and step 2, depth 5 reaches --z-toast (90). Warn before
// the collision so the conflict does not go silently wrong.
const MODAL_MAX_DEPTH = 4;

const ModalDepthContext = createContext(0);

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  // NOTE: accessible name for the dialog when `title` is not rendered.
  // Assistive tech otherwise sees an unnamed dialog.
  ariaLabel?: string;
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
  ariaLabel,
}: ModalProps) {
  const { t } = useTranslation();
  const depth = useContext(ModalDepthContext);
  const contentStyle =
    depth > 0
      ? { zIndex: `calc(var(--z-modal) + ${depth * MODAL_DEPTH_STEP})` }
      : undefined;
  const overlayStyle =
    depth > 0
      ? { zIndex: `calc(var(--z-modal) + ${depth * MODAL_DEPTH_STEP - 1})` }
      : undefined;
  const contentRef = useRef<HTMLDivElement>(null);
  // NOTE: Radix closes on pointerdown-outside by default, which closes mid-drag
  // (e.g. text selection released outside the modal). Instead we latch on
  // pointerdown-outside and only close if pointerup also lands outside.
  const pointerDownOutsideRef = useRef(false);

  useEffect(() => {
    if (isOpen && depth > MODAL_MAX_DEPTH) {
      console.warn(
        `[Modal] nesting depth ${depth} reaches --z-toast (90); stop nesting here or bump z-index tokens.`,
      );
    }
  }, [isOpen, depth]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownOutsideRef.current) return;
      pointerDownOutsideRef.current = false;
      const target = e.target as Node | null;
      if (!target || !contentRef.current?.contains(target)) onClose();
    };
    document.addEventListener("pointerup", handlePointerUp, true);
    return () => {
      document.removeEventListener("pointerup", handlePointerUp, true);
      pointerDownOutsideRef.current = false;
    };
  }, [isOpen, onClose]);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in",
            depth === 0 && "z-(--z-modal-overlay)",
          )}
        />
        <DialogPrimitive.Content
          ref={contentRef}
          style={contentStyle}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            pointerDownOutsideRef.current = true;
          }}
          // NOTE: Radix Dialog warns in dev when Content has no Description
          // child. Passing `undefined` explicitly acknowledges the absence so
          // the warning is suppressed; when `description` is set below, Radix
          // auto-wires the real id from the Description element's context.
          aria-describedby={undefined}
          // NOTE: when `title` renders a <DialogPrimitive.Title>, Radix wires
          // `aria-labelledby` from it automatically. When no title is
          // provided, `ariaLabel` gives the dialog an accessible name.
          aria-label={!title && ariaLabel ? ariaLabel : undefined}
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-bg-secondary focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            depth === 0 && "z-(--z-modal)",
            sizeClasses[size],
            className,
          )}
        >
          <ModalDepthContext.Provider value={depth + 1}>
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
          </ModalDepthContext.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
