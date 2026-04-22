import {
  AlertCircle,
  CheckCircle,
  Info,
  type LucideIcon,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Modal,
  PageContainer,
  Tooltip,
  useModalController,
  useToast,
} from "@/client/components";
import { useAuth } from "@/client/contexts/AuthContext";
import { useThemedAsset } from "@/client/contexts/ThemeContext";
import { cn } from "@/client/lib/utils";

interface ToastAction {
  labelKey: string;
  defaultLabel: string;
  messageKey: string;
  defaultMessage: string;
  type: "success" | "error" | "warning" | "info";
  icon: LucideIcon;
  iconClass: string;
}

// t('home.playground.title', 'UI playground')
// t('home.playground.subtitle', 'Examples to exercise Modal, Toast and Tooltip')
// t('home.playground.tooltip.label', 'Tooltip')
// t('home.playground.tooltip.description', 'Hover the marker to reveal guidance.')
// t('home.playground.tooltip.content', 'Remove this block before using the template in production.')
// t('home.playground.modal.label', 'Modal')
// t('home.playground.modal.description', 'Radix Dialog with focus trap and focus return to the trigger.')
// t('home.playground.modal.trigger', 'Open modal')
// t('home.playground.modal.title', 'Example modal')
// t('home.playground.modal.body', 'This modal uses Radix Dialog: focus is trapped, Esc closes, clicking outside closes, and focus returns to the trigger when closed.')
// t('home.playground.modal.cancel', 'Cancel')
// t('home.playground.modal.confirm', 'Confirm')
// t('home.playground.modal.confirmed', 'Modal confirmed')
// t('home.playground.toast.label', 'Toast')
// t('home.playground.toast.description', 'Four severities, swipe to dismiss.')
// t('common.logoAlt', 'Logo')
// t('home.playground.toast.success', 'Success')
// t('home.playground.toast.info', 'Info')
// t('home.playground.toast.warning', 'Warning')
// t('home.playground.toast.error', 'Error')
// t('home.playground.toast.successMessage', 'Saved successfully')
// t('home.playground.toast.infoMessage', 'This is informative')
// t('home.playground.toast.warningMessage', 'Careful with this')
// t('home.playground.toast.errorMessage', 'Something broke')
const TOAST_ACTIONS: ToastAction[] = [
  {
    labelKey: "home.playground.toast.success",
    defaultLabel: "Success",
    messageKey: "home.playground.toast.successMessage",
    defaultMessage: "Saved successfully",
    type: "success",
    icon: CheckCircle,
    iconClass: "text-success",
  },
  {
    labelKey: "home.playground.toast.info",
    defaultLabel: "Info",
    messageKey: "home.playground.toast.infoMessage",
    defaultMessage: "This is informative",
    type: "info",
    icon: Info,
    iconClass: "text-accent",
  },
  {
    labelKey: "home.playground.toast.warning",
    defaultLabel: "Warning",
    messageKey: "home.playground.toast.warningMessage",
    defaultMessage: "Careful with this",
    type: "warning",
    icon: AlertCircle,
    iconClass: "text-warning",
  },
  {
    labelKey: "home.playground.toast.error",
    defaultLabel: "Error",
    messageKey: "home.playground.toast.errorMessage",
    defaultMessage: "Something broke",
    type: "error",
    icon: XCircle,
    iconClass: "text-error",
  },
];

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const logo = useThemedAsset("/assets/logo.png");
  const exampleModal = useModalController();

  return (
    <PageContainer size="narrow" className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <img
          src={logo.src}
          alt={t("common.logoAlt", "Logo")}
          className="h-20 transition-all duration-300 hover:drop-shadow-accent"
        />
        <div>
          <h1 className="font-semibold text-text-primary text-xl">
            {t("home.welcome", "Welcome, {{email}}!", { email: user?.email })}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t("home.role", "Role: {{role}}", { role: user?.role })}
          </p>
        </div>
      </header>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-text-primary">
              {t("home.playground.title", "UI playground")}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {t(
                "home.playground.subtitle",
                "Examples to exercise Modal, Toast and Tooltip",
              )}
            </p>
          </div>
          <Tooltip
            content={t(
              "home.playground.tooltip.content",
              "Remove this block before using the template in production.",
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-border bg-bg-primary/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-text-secondary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <h3 className="font-medium text-sm">
                {t("home.playground.modal.label", "Modal")}
              </h3>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              {t(
                "home.playground.modal.description",
                "Radix Dialog with focus trap and focus return to the trigger.",
              )}
            </p>
            <Button size="sm" onClick={exampleModal.open}>
              {t("home.playground.modal.trigger", "Open modal")}
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-bg-primary/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-text-secondary">
              <Info className="h-4 w-4" aria-hidden="true" />
              <h3 className="font-medium text-sm">
                {t("home.playground.toast.label", "Toast")}
              </h3>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              {t(
                "home.playground.toast.description",
                "Four severities, swipe to dismiss.",
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {TOAST_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() =>
                    showToast(
                      // biome-ignore lint/plugin/no-dynamic-i18n-key: extracted via magic comments above TOAST_ACTIONS
                      t(action.messageKey, action.defaultMessage),
                      action.type,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-tertiary px-2.5 py-1 text-text-secondary text-xs transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <action.icon
                    className={cn("h-3.5 w-3.5", action.iconClass)}
                    aria-hidden="true"
                  />
                  {/* biome-ignore lint/plugin/no-dynamic-i18n-key: extracted via magic comments above TOAST_ACTIONS */}
                  {t(action.labelKey, action.defaultLabel)}
                </button>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <Modal
        modal={exampleModal}
        title={t("home.playground.modal.title", "Example modal")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={exampleModal.close}>
              {t("home.playground.modal.cancel", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                showToast(
                  t("home.playground.modal.confirmed", "Modal confirmed"),
                  "success",
                );
                exampleModal.close();
              }}
            >
              {t("home.playground.modal.confirm", "Confirm")}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          {t(
            "home.playground.modal.body",
            "This modal uses Radix Dialog: focus is trapped, Esc closes, clicking outside closes, and focus returns to the trigger when closed.",
          )}
        </p>
      </Modal>
    </PageContainer>
  );
}
