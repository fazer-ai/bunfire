import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/client/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  internalId: string;
  id?: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, id?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

const styles: Record<ToastType, string> = {
  success: "bg-bg-tertiary/90 text-text-primary border-success",
  error: "bg-bg-tertiary/90 text-text-primary border-error",
  warning: "bg-bg-tertiary/90 text-text-primary border-warning",
  info: "bg-bg-tertiary/90 text-text-primary border-accent",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
  info: "text-accent",
};

const ANIMATION_DURATION = 300;

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (internalId: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
        styles[toast.type],
      )}
      style={{
        transition: `transform ${ANIMATION_DURATION}ms ease-out, opacity ${ANIMATION_DURATION}ms ease-out`,
        transform: toast.isExiting ? "translateX(120%)" : "translateX(0)",
        opacity: toast.isExiting ? 0 : 1,
        animation: toast.isExiting
          ? undefined
          : `slideInFromRight ${ANIMATION_DURATION}ms ease-out`,
      }}
    >
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(120%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <span className={iconStyles[toast.type]}>{icons[toast.type]}</span>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.internalId)}
        className="p-1 transition-opacity hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toastsRef = useRef<Toast[]>([]);

  toastsRef.current = toasts;

  const removeToast = useCallback((internalId: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.internalId === internalId ? { ...t, isExiting: true } : t,
      ),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.internalId !== internalId));
    }, ANIMATION_DURATION);

    const timeout = toastTimeouts.current.get(internalId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(internalId);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", id?: string) => {
      if (id) {
        const existingToast = toastsRef.current.find((t) => t.id === id);
        if (existingToast) {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, message, type } : t)),
          );
          const existingTimeout = toastTimeouts.current.get(
            existingToast.internalId,
          );
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          const timeout = setTimeout(() => {
            removeToast(existingToast.internalId);
          }, 5000);
          toastTimeouts.current.set(existingToast.internalId, timeout);
          return;
        }
      }

      const internalId = crypto.randomUUID();
      const toast: Toast = { internalId, message, type, id };

      setToasts((prev) => [...prev, toast]);

      const timeout = setTimeout(() => {
        removeToast(internalId);
      }, 5000);
      toastTimeouts.current.set(internalId, timeout);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.internalId}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
