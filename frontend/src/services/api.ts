import { AuthUser, BattleScroll, Resume, Roast, UserStats } from "../types";
import {
  ApiErrorResponse,
  BackendMeResponse,
  BackendReactionSummary,
  BackendResume,
  BackendResumeDetailResponse,
  BackendResumeListResponse,
  BackendRoast,
  CompleteOnboardingResponse,
  GoogleAuthBeginResponse,
  GoogleAuthCallbackResponse,
  RefreshSessionResponse,
  UsernameAvailabilityResponse,
} from "./contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:3001";
  }
})();

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "UNKNOWN";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase();
};

const pickVariant = (seed: string): Resume["variant"] => {
  const variants: Resume["variant"][] = ["blue", "red", "green", "yellow"];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

const pickRoastVariant = (seed: string): Roast["variant"] => {
  const variants: Roast["variant"][] = ["yellow", "red", "blue"];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

const createHeaders = (contentType = true): HeadersInit => {
  const headers: HeadersInit = {};

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const parseError = async (response: Response): Promise<Error> => {
  let payload: ApiErrorResponse | null = null;
  try {
    payload = (await response.json()) as ApiErrorResponse;
  } catch {
    payload = null;
  }

  const message =
    payload?.error?.message || payload?.message || `Request failed with status ${response.status}`;

  if (response.status === 401) {
    return new Error("Please login to continue");
  }

  return new Error(message);
};

const shouldAttemptRefresh = (path: string): boolean => {
  return !path.startsWith("/api/auth/refresh") && !path.startsWith("/api/auth/logout");
};

const requestJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const requestInit: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...createHeaders(true),
      ...(options.headers || {}),
    },
  };

  let response = await fetch(`${API_BASE_URL}${path}`, requestInit);

  if (response.status === 401 && shouldAttemptRefresh(path)) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: createHeaders(true),
      });

      if (refreshResponse.ok) {
        response = await fetch(`${API_BASE_URL}${path}`, requestInit);
      }
    } catch {
      // Ignore refresh attempt errors and use original 401 response handling.
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
};

export const checkBackendHealth = async (path = "/api/health", timeoutMs = 2500): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      method: "GET",
      signal: controller.signal,
      credentials: "include",
      headers: createHeaders(false),
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const mapResume = (resume: BackendResume, roastsCount = 0, likesCount = 0): Resume => ({
  id: resume.id,
  userId: resume.userId,
  ownerUsername: resume.ownerUsername,
  name: resume.ownerUsername ? `@${resume.ownerUsername}` : "@unknown_user",
  role: resume.title,
  date: formatDate(resume.createdAt),
  fires: String(resume.burnsCount ?? likesCount),
  comments: String(resume.roastsCount ?? roastsCount),
  avatar: resume.ownerAvatarUrl,
  quote: resume.details,
  variant: pickVariant(resume.id),
  pdfUrl: normalizeFileUrl(resume.fileUrl),
});

const mapRoast = (roast: BackendRoast, index = 0): Roast => ({
  id: roast.id,
  resumeId: roast.resumeId,
  user: roast.username ? `${roast.username}` : "unknown_user",
  text: roast.text,
  createdAt: roast.createdAt,
  reactionCount: roast.reactionCount ?? (roast.upvotes ?? 0) + (roast.downvotes ?? 0),
  upvotes: roast.upvotes,
  downvotes: roast.downvotes,
  netScore: roast.netScore,
  reactedByMe: roast.reactedByMe ?? false,
  variant: pickRoastVariant(roast.id),
  align: index % 2 === 0 ? "end" : undefined,
});

const normalizeFileUrl = (rawUrl?: string | null): string | undefined => {
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith("/")) {
    return `${API_ORIGIN}${rawUrl}`;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

export const beginGoogleSignIn = async (): Promise<GoogleAuthBeginResponse> => {
  const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
  const params = callbackUrl ? `?redirectTo=${encodeURIComponent(callbackUrl)}` : "";
  return requestJson<GoogleAuthBeginResponse>(`/api/auth/google/url${params}`, { method: "GET" });
};

export const completeGoogleSignIn = async (code: string): Promise<GoogleAuthCallbackResponse> => {
  return requestJson<GoogleAuthCallbackResponse>(
    "/api/auth/google/callback",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    }
  );
};

export const completeGoogleSignInFromPayload = async (payload: {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}): Promise<GoogleAuthCallbackResponse> => {
  return requestJson<GoogleAuthCallbackResponse>(
    "/api/auth/google/callback",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};

export const checkUsernameAvailability = async (
  username: string
): Promise<UsernameAvailabilityResponse> => {
  const params = new URLSearchParams({ username });
  return requestJson<UsernameAvailabilityResponse>(
    `/api/auth/username-availability?${params.toString()}`,
    { method: "GET" }
  );
};

export const completeUsernameOnboarding = async (
  username: string
): Promise<CompleteOnboardingResponse> => {
  return requestJson<CompleteOnboardingResponse>(
    "/api/auth/onboarding/complete",
    {
      method: "POST",
      body: JSON.stringify({ username }),
    }
  );
};

export const refreshSession = async (): Promise<RefreshSessionResponse> => {
  return requestJson<RefreshSessionResponse>("/api/auth/refresh", { method: "POST" });
};

export const logoutSession = async (): Promise<void> => {
  await requestJson<{ success: boolean }>("/api/auth/logout", { method: "POST" });
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await requestJson<{ user: AuthUser }>("/api/auth/me", { method: "GET" });
  return response.user;
};

export const getResumes = async (
  page = 1,
  limit = 6,
  query = ""
): Promise<{ data: Resume[]; total: number; metrics: { totalBurns: number } }> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (query) params.set("query", query);

  const response = await requestJson<BackendResumeListResponse>(
    `/api/resumes?${params.toString()}`,
    { method: "GET" }
  );

  return {
    data: response.data.map((resume) => mapResume(resume)),
    total: response.total,
    metrics: {
      totalBurns: response.metrics?.totalBurns ?? 0,
    },
  };
};

export const getResumeById = async (id: string): Promise<{ resume: Resume; roasts: Roast[] } | null> => {
  try {
    const response = await requestJson<{ resume: BackendResume; roasts: BackendRoast[] }>(
      `/api/resumes/${id}`,
      { method: "GET" }
    );

    const mappedRoasts = response.roasts.map((roast, index) => mapRoast(roast, index));
    const reactionsTotal = mappedRoasts.reduce((sum, roast) => sum + roast.reactionCount, 0);

    return {
      resume: mapResume(response.resume, mappedRoasts.length, reactionsTotal),
      roasts: mappedRoasts,
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      return null;
    }
    throw error;
  }
};

export const getResumeRoastsById = async (
  id: string,
  includeVotes = true
): Promise<{ resume: Resume; roasts: Roast[] } | null> => {
  try {
    const params = new URLSearchParams();
    if (!includeVotes) params.set("includeVotes", "false");

    const response = await requestJson<BackendResumeDetailResponse>(
      `/api/resumes/${id}/roasts${params.toString() ? `?${params.toString()}` : ""}`,
      { method: "GET" }
    );

    const mappedRoasts = response.roasts.map((roast, index) => mapRoast(roast, index));
    const reactionsTotal = mappedRoasts.reduce((sum, roast) => sum + roast.reactionCount, 0);

    return {
      resume: mapResume(response.resume, mappedRoasts.length, reactionsTotal),
      roasts: mappedRoasts,
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
      return null;
    }
    throw error;
  }
};

export const addRoast = async (resumeId: string, text: string): Promise<Roast> => {
  const response = await requestJson<{ roast: BackendRoast }>(
    "/api/roasts",
    {
      method: "POST",
      body: JSON.stringify({ resumeId, text }),
    }
  );

  return mapRoast(response.roast, 0);
};

export const reactToRoast = async (roastId: string): Promise<BackendReactionSummary> => {
  return requestJson<BackendReactionSummary>(
    `/api/roasts/${roastId}/react`,
    {
      method: "POST",
    }
  );
};

export const unreactToRoast = async (roastId: string): Promise<BackendReactionSummary> => {
  return requestJson<BackendReactionSummary>(
    `/api/roasts/${roastId}/react`,
    {
      method: "DELETE",
    }
  );
};

// Temporary compatibility export while moving callers off vote semantics.
export const voteRoast = async (roastId: string): Promise<BackendReactionSummary> => {
  return reactToRoast(roastId);
};

export const getUserStats = async (): Promise<UserStats> => {
  const response = await requestJson<BackendMeResponse>("/api/auth/me", { method: "GET" });

  const resumesCount = response.stats?.resumes ?? response.user._count?.resumes ?? 0;
  const roastsReceived = response.stats?.roastsReceived ?? response.user._count?.roasts ?? 0;
  const burnsReceived = response.stats?.burnsReceived ?? 0;
  const globalRank = response.stats?.globalRank ?? 0;

  return {
    resumesOffered: String(resumesCount),
    totalRoastsReceived: String(roastsReceived),
    globalRank: globalRank > 0 ? `#${globalRank}` : "UNRANKED",
    level: Math.max(1, 1 + Math.floor(Math.max(0, burnsReceived) / 10)),
    name: response.user.googleDisplayName,
    role: `@${response.user.username}`,
    avatar: response.user.avatarUrl,
  };
};

export const getBattleScrolls = async (): Promise<BattleScroll[]> => {
  const list = await requestJson<{ data: BackendResume[]; total: number }>(
    "/api/resumes/mine",
    { method: "GET" }
  );

  return list.data
    .map((resume) => ({
      id: resume.id,
      name: `${resume.title}.pdf`,
      date: formatDate(resume.createdAt),
      roasts: String(resume.roastsCount ?? 0),
      description: resume.details,
      colors: ["bg-primary-container", "bg-tertiary-container"],
    }));
};

export const uploadResume = async (resumeData: {
  title: string;
  field: string;
  details: string;
  isClassified: boolean;
  file?: File | null;
}): Promise<Resume> => {
  let fileUrl: string | null = null;

  if (resumeData.file) {
    const formData = new FormData();
    formData.append("file", resumeData.file);

    const uploadResponse = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw await parseError(uploadResponse);
    }

    const uploadPayload = (await uploadResponse.json()) as {
      file: { url: string; absoluteUrl?: string };
    };

    fileUrl = uploadPayload.file.absoluteUrl || normalizeFileUrl(uploadPayload.file.url) || null;
  }

  const createResponse = await requestJson<{ resume: BackendResume }>(
    "/api/resumes",
    {
      method: "POST",
      body: JSON.stringify({
        title: resumeData.title,
        field: resumeData.field,
        details: resumeData.details,
        isClassified: resumeData.isClassified,
        fileUrl,
      }),
    }
  );

  return mapResume(createResponse.resume);
};

export const updateResumeById = async (
  resumeId: string,
  payload: Partial<{ title: string; field: string; details: string; isClassified: boolean; fileUrl: string | null }>
): Promise<Resume> => {
  const response = await requestJson<{ resume: BackendResume }>(
    `/api/resumes/${resumeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  return mapResume(response.resume);
};

export const deleteResumeById = async (resumeId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
    method: "DELETE",
    credentials: "include",
    headers: createHeaders(false),
  });

  if (!response.ok) {
    throw await parseError(response);
  }
};
