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

interface ToastOptions {
  key?: string;
}

interface Toast {
  id: string;
  key?: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    options?: ToastOptions,
  ) => void;
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
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const styles: Record<ToastType, string> = {
  success: "bg-green-900/90 text-green-100 border-green-700",
  error: "bg-red-900/90 text-red-100 border-red-700",
  warning: "bg-amber-900/90 text-amber-100 border-amber-700",
  info: "bg-blue-900/90 text-blue-100 border-blue-700",
};

const ANIMATION_DURATION = 300;

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg",
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
      {icons[toast.type]}
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toastsRef = useRef<Toast[]>([]);

  toastsRef.current = toasts;

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ANIMATION_DURATION);

    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      if (options?.key) {
        const existingToast = toastsRef.current.find(
          (t) => t.key === options.key,
        );
        if (existingToast) {
          setToasts((prev) =>
            prev.map((t) =>
              t.key === options.key ? { ...t, message, type } : t,
            ),
          );
          const existingTimeout = toastTimeouts.current.get(existingToast.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          const timeout = setTimeout(() => {
            removeToast(existingToast.id);
          }, 5000);
          toastTimeouts.current.set(existingToast.id, timeout);
          return;
        }
      }

      const id = crypto.randomUUID();
      const toast: Toast = { id, message, type, key: options?.key };

      setToasts((prev) => [...prev, toast]);

      const timeout = setTimeout(() => {
        removeToast(id);
      }, 5000);
      toastTimeouts.current.set(id, timeout);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
