import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../constants";
import { AuthUser } from "../types";
import {
  beginGoogleSignIn,
  completeGoogleSignInFromPayload,
  completeUsernameOnboarding,
  getCurrentUser,
  logoutSession,
} from "../services/api";
import { PendingGoogleProfile } from "../services/contracts";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  onboardingRequired: boolean;
  pendingProfile: PendingGoogleProfile | null;
  isAuthPanelOpen: boolean;
  openAuthPanel: () => void;
  closeAuthPanel: () => void;
  beginGoogleAuth: () => Promise<void>;
  clearAuthError: () => void;
  handleGoogleCallback: (payload: {
    code?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }) => Promise<{ onboardingRequired: boolean }>;
  completeOnboarding: (username: string) => Promise<void>;
  logout: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_TOKEN_SENTINEL = "cookie-session";

const getStoredPendingProfile = (): PendingGoogleProfile | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH_PENDING_PROFILE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingGoogleProfile;
  } catch {
    return null;
  }
};

const getStoredOnboardingRequired = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.AUTH_ONBOARDING_REQUIRED) === "true";
};

const clearLegacyAuthStorage = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_EXPIRES_AT);
};

const storeOnboardingState = (
  onboardingRequired: boolean,
  pendingProfile: PendingGoogleProfile | null
): void => {
  if (typeof window === "undefined") return;

  if (!onboardingRequired) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_ONBOARDING_REQUIRED);
    localStorage.removeItem(STORAGE_KEYS.AUTH_PENDING_PROFILE);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.AUTH_ONBOARDING_REQUIRED, "true");
  if (pendingProfile) {
    localStorage.setItem(STORAGE_KEYS.AUTH_PENDING_PROFILE, JSON.stringify(pendingProfile));
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState<boolean>(getStoredOnboardingRequired());
  const [pendingProfile, setPendingProfile] = useState<PendingGoogleProfile | null>(getStoredPendingProfile());
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    setOnboardingRequired(false);
    setPendingProfile(null);
    clearLegacyAuthStorage();
    storeOnboardingState(false, null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      clearLegacyAuthStorage();

      try {
        const currentUser = await getCurrentUser();
        setToken(SESSION_TOKEN_SENTINEL);
        setUser(currentUser);
        setOnboardingRequired(false);
        setPendingProfile(null);
        storeOnboardingState(false, null);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("onboarding")) {
          setToken(SESSION_TOKEN_SENTINEL);
          setUser(null);
          setOnboardingRequired(true);
          setPendingProfile(getStoredPendingProfile());
          storeOnboardingState(true, getStoredPendingProfile());
        } else {
          clearSession();
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const openAuthPanel = (): void => {
    setAuthError(null);
    setIsAuthPanelOpen(true);
  };

  const closeAuthPanel = (): void => {
    setIsAuthPanelOpen(false);
  };

  const beginGoogleAuthFlow = async (): Promise<void> => {
    setAuthError(null);
    try {
      const response = await beginGoogleSignIn();
      window.location.assign(response.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign in failed";
      setAuthError(message);
      throw error;
    }
  };

  const handleGoogleCallback = async (payload: {
    code?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }): Promise<{ onboardingRequired: boolean }> => {
    setAuthError(null);
    const response = await completeGoogleSignInFromPayload(payload);

    setToken(SESSION_TOKEN_SENTINEL);

    if (response.onboardingRequired || !response.user) {
      setUser(null);
      setOnboardingRequired(true);
      setPendingProfile(response.pendingProfile || null);
      storeOnboardingState(true, response.pendingProfile || null);
      return { onboardingRequired: true };
    }

    setUser(response.user);
    setOnboardingRequired(false);
    setPendingProfile(null);
    storeOnboardingState(false, null);
    return { onboardingRequired: false };
  };

  const completeOnboarding = async (username: string): Promise<void> => {
    setAuthError(null);
    const response = await completeUsernameOnboarding(username);
    setUser(response.user);
    setOnboardingRequired(false);
    setPendingProfile(null);
    storeOnboardingState(false, null);
  };

  const logout = async (): Promise<void> => {
    try {
      if (token || user || onboardingRequired) {
        await logoutSession();
      }
    } catch {
      // Ignore logout API failures and clear local state regardless.
    } finally {
      clearSession();
      setAuthError(null);
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && !onboardingRequired),
    isAuthLoading,
    authError,
    onboardingRequired,
    pendingProfile,
    isAuthPanelOpen,
    openAuthPanel,
    closeAuthPanel,
    beginGoogleAuth: async () => {
      try {
        await beginGoogleAuthFlow();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Google sign in failed";
        setAuthError(message);
        throw error;
      }
    },
    clearAuthError: () => setAuthError(null),
    handleGoogleCallback: async (payload) => {
      try {
        return await handleGoogleCallback(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Google callback failed";
        setAuthError(message);
        throw error;
      }
    },
    completeOnboarding: async (username) => {
      try {
        await completeOnboarding(username);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Onboarding failed";
        setAuthError(message);
        throw error;
      }
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

