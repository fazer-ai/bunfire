import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/client/contexts/ThemeContext";
import {
  type GoogleCredentialResponse,
  loadGsiScript,
} from "@/client/lib/google";

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
  onError?: (error: unknown) => void;
}

type Status = "loading" | "ready" | "error";

export function GoogleSignInButton({
  clientId,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const { resolvedTheme } = useTheme();
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    setStatus("loading");

    loadGsiScript()
      .then((id) => {
        if (cancelled || !containerRef.current) return;

        id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            onCredentialRef.current(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        observer = new MutationObserver(() => {
          if (containerRef.current?.childNodes.length) {
            setStatus("ready");
            observer?.disconnect();
            observer = null;
          }
        });
        observer.observe(containerRef.current, { childList: true });

        id.renderButton(containerRef.current, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: containerRef.current.offsetWidth || 320,
          locale: i18n.language,
        });

        id.prompt();
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.(err);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.google?.accounts?.id?.cancel();
    };
  }, [clientId, resolvedTheme, i18n.language]);

  return (
    <div className="relative min-h-[44px]">
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-md bg-bg-tertiary"
        />
      )}
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
