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

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type BackendResume = {
  id: string;
  userId: string;
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  fileUrl?: string | null;
  roastsCount?: number;
  burnsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendRoast = {
  id: string;
  resumeId: string;
  userId: string;
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
