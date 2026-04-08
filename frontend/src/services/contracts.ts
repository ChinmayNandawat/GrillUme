import type { AuthUser } from "../types";

export type ApiErrorResponse = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

export type GoogleAuthBeginResponse = {
  url: string;
  provider: "google";
  prompt: "select_account";
};

export type PendingGoogleProfile = {
  googleUid: string;
  googleDisplayName: string;
  avatarUrl: string;
};

export type GoogleAuthCallbackResponse = {
  onboardingRequired: boolean;
  user?: AuthUser;
  pendingProfile?: PendingGoogleProfile;
};

export type RefreshSessionResponse = {
  refreshed: boolean;
  onboardingRequired: boolean;
  user?: AuthUser;
  pendingProfile?: PendingGoogleProfile;
};

export type UsernameAvailabilityResponse = {
  available: boolean;
  username: string;
  reason?: string;
};

export type CompleteOnboardingResponse = {
  user: AuthUser;
  onboardingRequired: false;
};

export type BackendResume = {
  id: string;
  userId?: string;
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  fileUrl?: string | null;
  ownerUsername?: string;
  ownerAvatarUrl?: string;
  roastsCount?: number;
  burnsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendRoast = {
  id: string;
  resumeId: string;
  username: string;
  text: string;
  createdAt: string;
};

export type BackendMeResponse = {
  user: AuthUser & { _count?: { resumes?: number; roasts?: number } };
  stats?: {
    resumes?: number;
    roastsReceived?: number;
    burnsReceived?: number;
    globalRank?: number;
  };
};

export type BackendResumeListResponse = {
  data: BackendResume[];
  total: number;
  metrics?: { totalBurns?: number };
};

export type BackendVotesSummary = {
  upvotes: number;
  downvotes: number;
};
