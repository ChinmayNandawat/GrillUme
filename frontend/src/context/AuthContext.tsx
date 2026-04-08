import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState<boolean>(false);
  const [pendingProfile, setPendingProfile] = useState<PendingGoogleProfile | null>(null);
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);

  const clearSession = () => {
    setUser(null);
    setOnboardingRequired(false);
    setPendingProfile(null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setOnboardingRequired(false);
        setPendingProfile(null);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("onboarding")) {
          setUser(null);
          setOnboardingRequired(true);
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

    if (response.onboardingRequired || !response.user) {
      setUser(null);
      setOnboardingRequired(true);
      setPendingProfile(response.pendingProfile || null);
      return { onboardingRequired: true };
    }

    setUser(response.user);
    setOnboardingRequired(false);
    setPendingProfile(null);
    return { onboardingRequired: false };
  };

  const completeOnboarding = async (username: string): Promise<void> => {
    setAuthError(null);
    const response = await completeUsernameOnboarding(username);
    setUser(response.user);
    setOnboardingRequired(false);
    setPendingProfile(null);
  };

  const logout = async (): Promise<void> => {
    try {
      if (user || onboardingRequired) {
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

