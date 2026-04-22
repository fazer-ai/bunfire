import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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

// NOTE: Wrap both branches in tuples to stop TS from distributing over union
// payload types. Without it, `T = Instance | null` collapses to a function
// union whose parameter becomes `Instance & null` (i.e. `never`) and no call
// typechecks.
// biome-ignore lint/suspicious/noConfusingVoidType: `void` is the sentinel for "no payload" and matches the generic default on useModalController; it is only ever used inside this type-level distribution check.
type OpenFn<T> = [T] extends [void]
  ? () => void
  : [T] extends [undefined]
    ? () => void
    : (payload: T) => void;

export type ModalController<T = void> = {
  isOpen: boolean;
  payload: T | undefined;
  open: OpenFn<T>;
  close: () => void;
};

const ModalControllerContext = createContext<ModalController<unknown> | null>(
  null,
);

// NOTE: Controller API — state lifted from the modal wrapper into a hook the
// parent owns. Payload is retained across `close()` so Radix can play its exit
// animation with the last-opened data still rendered; it's only overwritten
// on the next `open()`. Do NOT unmount the <Modal> via `{flag && <Modal/>}` —
// the Radix Dialog.Root must stay alive through the exit animation or it is
// skipped entirely.
export function useModalController<T = void>(opts?: {
  onOpen?: (payload: T | undefined) => void;
  onClose?: () => void;
}): ModalController<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<T | undefined>(undefined);
  const onOpenRef = useRef(opts?.onOpen);
  const onCloseRef = useRef(opts?.onClose);
  onOpenRef.current = opts?.onOpen;
  onCloseRef.current = opts?.onClose;

  const open = useCallback((nextPayload?: T) => {
    setPayload(nextPayload);
    setIsOpen(true);
    onOpenRef.current?.(nextPayload);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onCloseRef.current?.();
  }, []);

  return useMemo(
    () =>
      ({
        isOpen,
        payload,
        open: open as OpenFn<T>,
        close,
      }) satisfies ModalController<T>,
    [isOpen, payload, open, close],
  );
}

export function useModal<T = void>(): ModalController<T> {
  const ctx = useContext(ModalControllerContext);
  if (!ctx) {
    throw new Error(
      "useModal must be used inside a <Modal modal={...}> subtree.",
    );
  }
  return ctx as unknown as ModalController<T>;
}

// NOTE: Convenience for the common "init state when the modal opens" pattern.
// Fires `effect` each time the passed controller's `isOpen` transitions from
// false to true, and runs the optional cleanup when it transitions back to
// false. Takes the controller directly (not the boolean) because this hook
// is typically called in the wrapper component *before* `<Modal>` mounts its
// `ModalControllerContext.Provider`, so it cannot read the controller from
// context the way `useModal` does. The effect closure is refreshed on every
// render, so it always sees the latest props and state without re-firing
// mid-open (which would clobber user edits on an unrelated prop change). For
// behavior that must react to changes while the modal is open, use
// `useEffect` directly.
export function useOnModalOpen(
  modal: Pick<ModalController<unknown>, "isOpen">,
  // biome-ignore lint/suspicious/noConfusingVoidType: matches React's EffectCallback shape — `void` means "caller ignores any non-cleanup return", and `(() => void)` is the optional cleanup.
  effect: () => void | (() => void),
) {
  const { isOpen } = modal;
  const effectRef = useRef(effect);
  effectRef.current = effect;
  useEffect(() => {
    if (!isOpen) return;
    return effectRef.current();
  }, [isOpen]);
}

interface ModalProps {
  children: ReactNode;
  // biome-ignore lint/suspicious/noExplicitAny: Modal only reads isOpen/close; accept any controller variant so ModalController<T> for any T can pass through without unsafe casts at every call site.
  modal: ModalController<any>;
  title?: string;
  description?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  // NOTE: accessible name for the dialog when `title` is not rendered.
  // Assistive tech otherwise sees an unnamed dialog.
  ariaLabel?: string;
  // NOTE: when false, clicks outside the content do not close the modal.
  // Escape key still works. Use for flows where accidental dismiss is costly
  // (e.g. pricing/checkout modals).
  closeOnOutsideClick?: boolean;
  // NOTE: intercept user-driven close requests (Esc, outside click, X button)
  // to show a confirmation before closing. Called instead of `modal.close()`;
  // the handler is responsible for eventually calling `modal.close()` itself
  // (or not). Programmatic `modal.close()` calls from the parent are
  // unaffected.
  onCloseRequest?: () => void;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  children,
  modal,
  title,
  description,
  footer,
  size = "md",
  className,
  ariaLabel,
  closeOnOutsideClick = true,
  onCloseRequest,
}: ModalProps) {
  const { t } = useTranslation();
  const { isOpen } = modal;
  const close = onCloseRequest ?? modal.close;
  const depth = useContext(ModalDepthContext);
  // NOTE: cap the z-index calculation at MODAL_MAX_DEPTH so any deeper nesting
  // keeps stacking via DOM order without colliding with the toast layer at
  // depth 5+. The warning below still fires so the conflict is visible
  // during development.
  const effectiveDepth = Math.min(depth, MODAL_MAX_DEPTH);
  const contentStyle =
    effectiveDepth > 0
      ? {
          zIndex: `calc(var(--z-modal) + ${effectiveDepth * MODAL_DEPTH_STEP})`,
        }
      : undefined;
  const overlayStyle =
    effectiveDepth > 0
      ? {
          zIndex: `calc(var(--z-modal) + ${effectiveDepth * MODAL_DEPTH_STEP - 1})`,
        }
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
    if (!isOpen || !closeOnOutsideClick) return;
    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownOutsideRef.current) return;
      pointerDownOutsideRef.current = false;
      const target = e.target as Node | null;
      if (!target || !contentRef.current?.contains(target)) close();
    };
    document.addEventListener("pointerup", handlePointerUp, true);
    return () => {
      document.removeEventListener("pointerup", handlePointerUp, true);
      pointerDownOutsideRef.current = false;
    };
  }, [isOpen, close, closeOnOutsideClick]);

  return (
    <ModalControllerContext.Provider value={modal}>
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
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
              if (closeOnOutsideClick) pointerDownOutsideRef.current = true;
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
    </ModalControllerContext.Provider>
  );
}
