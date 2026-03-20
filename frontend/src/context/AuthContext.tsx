import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../constants";
import { AuthUser } from "../types";
import { loginUser, registerUser, getCurrentUser } from "../services/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  isAuthPanelOpen: boolean;
  openAuthPanel: () => void;
  closeAuthPanel: () => void;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

const storeToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    storeToken(null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const existingToken = getStoredToken();
      if (!existingToken) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setToken(existingToken);
        setUser(currentUser);
      } catch (error) {
        clearSession();
      } finally {
        setIsAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    const response = await loginUser(email, password);
    setToken(response.token);
    setUser(response.user);
    storeToken(response.token);
    setIsAuthPanelOpen(false);
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    setAuthError(null);
    const response = await registerUser(username, email, password);
    setToken(response.token);
    setUser(response.user);
    storeToken(response.token);
    setIsAuthPanelOpen(false);
  };

  const logout = () => {
    clearSession();
    setAuthError(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAuthLoading,
      authError,
      isAuthPanelOpen,
      openAuthPanel: () => setIsAuthPanelOpen(true),
      closeAuthPanel: () => setIsAuthPanelOpen(false),
      clearAuthError: () => setAuthError(null),
      login: async (email, password) => {
        try {
          await login(email, password);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Login failed";
          setAuthError(message);
          throw error;
        }
      },
      register: async (username, email, password) => {
        try {
          await register(username, email, password);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Registration failed";
          setAuthError(message);
          throw error;
        }
      },
      logout,
    }),
    [user, token, isAuthLoading, authError, isAuthPanelOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
