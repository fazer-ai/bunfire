import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router";
import { Button, GoogleSignInButton, Input } from "@/client/components";
import { useAuth } from "@/client/contexts/AuthContext";
import { useGoogleSignIn } from "@/client/hooks/useGoogleSignIn";
import { api } from "@/client/lib/api";
import type { ApiErrorPayload } from "@/client/lib/types";
import { cn } from "@/client/lib/utils";

// biome-ignore lint/plugin: auth page renders its own centered layout outside <Layout>, so <PageContainer> does not apply
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, login, providers } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { pending: googlePending, signIn: signInWithGoogle } = useGoogleSignIn({
    onError: setError,
  });
  const authPending = loading || googlePending;
  // NOTE: Synchronous cross-method lock so a Google credential callback and a
  // form submit cannot both pass their guards before React commits the pending
  // state update.
  const authInFlightRef = useRef(false);

  if (user) return <Navigate to="/" replace />;

  const handleGoogleCredential = (credential: string) => {
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setError("");
    void signInWithGoogle(credential).finally(() => {
      authInFlightRef.current = false;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (authInFlightRef.current) return;
    setError("");
    authInFlightRef.current = true;
    setLoading(true);

    try {
      const { data, error: apiError } = await api.api.auth.login.post({
        email,
        password,
      });

      if (apiError) {
        setError(
          (apiError.value as ApiErrorPayload)?.error ||
            t("auth.loginFailed", "Login failed"),
        );
        return;
      }

      if (data?.user) {
        login(data.user);
        navigate("/");
      }
    } catch {
      setError(
        t("auth.genericError", "Something went wrong. Please try again."),
      );
    } finally {
      authInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center font-bold text-3xl text-text-primary">
          {t("auth.login", "Login")}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-bg-secondary p-8"
        >
          {error && (
            <div className="rounded-lg border border-error bg-error-soft px-4 py-2 text-error text-sm">
              {error}
            </div>
          )}

          {providers.google && (
            <>
              <div
                className={cn({ "opacity-50": authPending })}
                aria-busy={authPending}
              >
                <GoogleSignInButton
                  clientId={providers.google.clientId}
                  onCredential={handleGoogleCredential}
                  disabled={googlePending}
                  onError={() =>
                    setError(
                      t("auth.googleSignInFailed", "Google sign-in failed"),
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-text-secondary text-xs uppercase">
                  {t("auth.or", "or")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block font-medium text-sm text-text-primary"
            >
              {t("auth.email", "Email")}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={authPending}
              placeholder={t("auth.emailPlaceholder", "you@example.com")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-medium text-sm text-text-primary"
            >
              {t("auth.password", "Password")}
            </label>
            <Input
              id="password"
              type="password"
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={authPending}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={authPending}
            className="w-full"
          >
            {loading
              ? t("auth.loggingIn", "Logging in...")
              : t("auth.login", "Login")}
          </Button>
        </form>

        <p className="mt-4 text-center text-text-secondary">
          {t("auth.noAccount", "Don't have an account?")}{" "}
          <Link
            to="/signup"
            className="font-medium text-accent hover:underline"
          >
            {t("auth.signup", "Sign Up")}
          </Link>
        </p>
      </div>
    </div>
  );
}
