import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthUser } from "@/lib/api/auth";
import {
  ApiAudience,
  setApiAudienceProvider,
  setApiTokenProvider,
  setApiUnauthorizedHandler,
} from "@/lib/api/client";
import { clearGuestToken, getGuestToken } from "@/lib/guestSession";
import { toast } from "@/hooks/use-toast";

const AUTH_STORAGE_KEY = "hempit.auth.session";
const LOGIN_ROUTE = "/login";
const SIGNUP_ROUTE = "/signup";
const PUBLIC_AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/retailer-login",
  "/retailer-signup",
  "/wholesale-login",
  "/wholesale-signup",
]);

type LogoutReason = "manual" | "expired" | "unauthorized";

interface LogoutOptions {
  reason?: LogoutReason;
}

interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  setSession: (session: AuthSession) => void;
  updateUser: (user: AuthUser) => void;
  logout: (options?: LogoutOptions) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const isBrowser = () => typeof window !== "undefined";
const isPublicAuthRoute = (pathname: string) => PUBLIC_AUTH_ROUTES.has(pathname);
const getRouteTarget = (pathname: string, search: string) =>
  `${pathname}${search}`;

const getAudienceForUser = (user: AuthUser | null | undefined): ApiAudience => {
  const normalizedRole = user?.role?.trim().toLowerCase();

  if (normalizedRole === "wholesaler" || normalizedRole === "wholesale") {
    return "wholesaler";
  }

  return user ? "retailer" : "guest";
};

const parseJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4 || 4)) % 4),
      "=",
    );
    const decoded =
      typeof window !== "undefined" && typeof window.atob === "function"
        ? window.atob(paddedBase64)
        : "";

    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

const getTokenExpiryTime = (token: string) => {
  const payload = parseJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};

const persistSession = (session: AuthSession | null) => {
  if (!isBrowser()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const readStoredSession = (): {
  session: AuthSession | null;
  wasExpired: boolean;
} => {
  if (!isBrowser()) {
    return {
      session: null,
      wasExpired: false,
    };
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return {
      session: null,
      wasExpired: false,
    };
  }

  try {
    const parsed = JSON.parse(rawSession) as {
      token?: unknown;
      user?: AuthUser;
    };

    if (typeof parsed.token !== "string" || !parsed.user) {
      return {
        session: null,
        wasExpired: false,
      };
    }

    if (isTokenExpired(parsed.token)) {
      return {
        session: null,
        wasExpired: true,
      };
    }

    return {
      session: {
        token: parsed.token,
        user: parsed.user,
      },
      wasExpired: false,
    };
  } catch {
    return {
      session: null,
      wasExpired: false,
    };
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const logoutLockRef = useRef(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(
    (options: LogoutOptions = {}) => {
      const reason = options.reason || "manual";

      if (logoutLockRef.current && reason !== "manual") {
        return;
      }

      logoutLockRef.current = true;

      setSessionState(null);
      persistSession(null);
      queryClient.removeQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["order-history"] });
      queryClient.removeQueries({ queryKey: ["products"] });
      queryClient.removeQueries({ queryKey: ["user"] });
      queryClient.removeQueries({ queryKey: ["user-profile"] });

      if (reason === "manual") {
        toast({
          title: "Logged out",
          description: "You have been signed out.",
        });
      } else {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      }

      const redirectTarget = getRouteTarget(location.pathname, location.search);
      navigate(LOGIN_ROUTE, {
        replace: true,
        state: isPublicAuthRoute(location.pathname)
          ? undefined
          : { from: redirectTarget },
      });
    },
    [location.pathname, location.search, navigate, queryClient],
  );

  useEffect(() => {
    const storedSession = readStoredSession();

    if (storedSession.session) {
      setSessionState(storedSession.session);
    } else {
      persistSession(null);
    }

    setIsAuthReady(true);

    if (storedSession.wasExpired) {
      logoutLockRef.current = true;

      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });

      if (!isPublicAuthRoute(location.pathname)) {
        navigate(LOGIN_ROUTE, {
          replace: true,
          state: {
            from: getRouteTarget(location.pathname, location.search),
          },
        });
      }
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    setApiTokenProvider(() => session?.token || getGuestToken());

    return () => {
      setApiTokenProvider(null);
    };
  }, [session?.token]);

  useEffect(() => {
    setApiAudienceProvider(() => {
      if (session?.user) {
        return getAudienceForUser(session.user);
      }

      return "guest";
    });

    return () => {
      setApiAudienceProvider(null);
    };
  }, [session?.user]);

  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      logout({ reason: "expired" });
    });

    return () => {
      setApiUnauthorizedHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const expiresAt = getTokenExpiryTime(session.token);

    if (!expiresAt) {
      return;
    }

    const timeoutMs = expiresAt - Date.now();

    if (timeoutMs <= 0) {
      logout({ reason: "expired" });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout({ reason: "expired" });
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [logout, session?.token]);

  const setSession = (nextSession: AuthSession) => {
    logoutLockRef.current = false;
    // Once logged in, always prefer user token over guest token.
    clearGuestToken();
    queryClient.removeQueries({ queryKey: ["cart"] });
    queryClient.removeQueries({ queryKey: ["dashboard"] });
    queryClient.removeQueries({ queryKey: ["order-history"] });
    queryClient.removeQueries({ queryKey: ["products"] });
    queryClient.removeQueries({ queryKey: ["user-profile"] });
    setSessionState(nextSession);
    persistSession(nextSession);
  };

  const updateUser = (user: AuthUser) => {
    setSessionState((previousSession) => {
      if (!previousSession) {
        return previousSession;
      }

      const updatedSession = {
        ...previousSession,
        user,
      };

      persistSession(updatedSession);

      return updatedSession;
    });
  };

  const value = useMemo<AuthContextType>(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      isAuthReady,
      setSession,
      updateUser,
      logout,
    }),
    [isAuthReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
