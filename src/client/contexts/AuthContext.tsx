import { Loader2 } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useThemedAsset } from "@/client/contexts/ThemeContext";
import { api } from "@/client/lib/api";
import { getAssetUrl } from "@/client/lib/utils";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface GoogleAuthProvider {
  clientId: string;
}

export interface AuthProviders {
  google?: GoogleAuthProvider;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  providers: AuthProviders;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<AuthProviders>({});
  const [loading, setLoading] = useState(true);

  const logoPath = useThemedAsset("/assets/logo.png");
  const clearUser = useCallback(() => setUser(null), []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await api.api.auth.me.get();
        if (data && !error) {
          if (data.user) setUser(data.user);
          const next: AuthProviders = {};
          if (
            data.providers &&
            typeof data.providers === "object" &&
            "google" in data.providers &&
            data.providers.google &&
            typeof data.providers.google === "object" &&
            "clientId" in data.providers.google &&
            typeof data.providers.google.clientId === "string"
          ) {
            next.google = { clientId: data.providers.google.clientId };
          }
          setProviders(next);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", clearUser);
    return () => window.removeEventListener("auth:unauthorized", clearUser);
  }, [clearUser]);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const logout = async () => {
    try {
      await api.api.auth.logout.post();
      setUser(null);
    } catch {
      console.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary">
        <img src={getAssetUrl(logoPath)} alt="Logo" className="h-10" />
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, providers, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
